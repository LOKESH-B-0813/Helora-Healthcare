import logging
import re
from functools import wraps

import requests
from appwrite.client import Client
from appwrite.services.account import Account
from flask import current_app, g, jsonify, request


VALID_ROLES = {'super_admin', 'admin', 'doctor', 'patient', 'employee'}


def _get_token_from_header():
    authorization = request.headers.get('Authorization', '')
    logging.info(
        'Auth header received: present=%s scheme=%s length=%s',
        bool(authorization),
        authorization.split(' ', 1)[0] if authorization else '',
        len(authorization),
    )
    if authorization.startswith('Bearer '):
        token = authorization.split(' ', 1)[1].strip()
        logging.info('Bearer token extracted: present=%s length=%s', bool(token), len(token))
        return token
    return None


def _as_dict(value):
    if isinstance(value, dict):
        result = dict(value)
    elif hasattr(value, 'model_dump'):
        result = value.model_dump(by_alias=True)
    else:
        return {}
    nested_data = result.get('data')
    if isinstance(nested_data, dict):
        result.update(nested_data)
    return result


def _verify_appwrite_user(token, endpoint, project_id, timeout):
    request_timeout = min(timeout, 8)
    logging.info('Appwrite JWT verification request: endpoint=%s project=%s token_length=%s', endpoint, project_id, len(token))
    for attempt in range(2):
        try:
            response = requests.get(
                f'{endpoint.rstrip("/")}/account',
                headers={
                    'X-Appwrite-Project': project_id,
                    'X-Appwrite-JWT': token,
                },
                timeout=request_timeout,
            )
            response.raise_for_status()
            logging.info('Appwrite JWT verification response: status=%s user_id=%s', response.status_code, response.json().get('$id'))
            return _as_dict(response.json())
        except requests.RequestException:
            if attempt == 1:
                raise


def _get_user_record(user_id, endpoint, project_id, api_key, database_id, table_id, timeout, email=None):
    if not endpoint or not project_id or not api_key or not database_id or not table_id:
        raise RuntimeError('Appwrite users table is not configured')

    response = requests.get(
        f'{endpoint.rstrip("/")}/tablesdb/{database_id}/tables/{table_id}/rows',
        headers={
            'X-Appwrite-Project': project_id,
            'X-Appwrite-Key': api_key,
        },
        timeout=min(timeout, 8),
    )
    response.raise_for_status()
    rows = response.json().get('rows', [])
    logging.info('Users table lookup response: status=%s user_id=%s email=%s row_count=%s', response.status_code, user_id, email, len(rows))

    for row in rows:
        record = _as_dict(row)
        if str(record.get('user_id')) == str(user_id):
            return record
    if email:
        normalized_email = str(email).strip().lower()
        for row in rows:
            record = _as_dict(row)
            if str(record.get('email') or '').strip().lower() == normalized_email:
                return record
    return None


def _normalize_role(value):
    role = re.sub(r'[^a-z0-9]+', '_', str(value or '').strip().lower()).strip('_')
    if role == 'super_admin_founder':
        role = 'super_admin'
    return role if role in VALID_ROLES else None


def _permissions(record):
    value = record.get('permissions') or ''
    if isinstance(value, list):
        return {str(item).strip() for item in value if str(item).strip()}
    return {item.strip() for item in str(value).split(',') if item.strip()}


def require_auth(role=None, optional=False):
    """Validate an Appwrite JWT and enforce the users-table application role."""
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            token = _get_token_from_header()
            if not token:
                if optional:
                    g.user = None
                    return function(*args, **kwargs)
                return jsonify({'error': 'Missing Authorization token'}), 401

            try:
                endpoint = current_app.config['APPWRITE_ENDPOINT']
                project_id = current_app.config['APPWRITE_PROJECT_ID']
                request_timeout = current_app.config.get('APPWRITE_REQUEST_TIMEOUT_SECONDS', 20)
                api_key = current_app.config.get('APPWRITE_API_KEY')
                database_id = current_app.extensions.get('appwrite_database_id')
                table_id = current_app.extensions.get('appwrite_users_table_id')
                appwrite_user = _verify_appwrite_user(
                    token,
                    endpoint,
                    project_id,
                    request_timeout,
                )
                logging.info('Auth identity resolved: user_id=%s email=%s', appwrite_user.get('$id'), appwrite_user.get('email'))
                user_id = appwrite_user.get('$id') or appwrite_user.get('id')
                email = appwrite_user.get('email')
                if not user_id:
                    return jsonify({'error': 'Invalid Appwrite user identity'}), 401
                record = _get_user_record(
                    user_id,
                    endpoint,
                    project_id,
                    api_key,
                    database_id,
                    table_id,
                    request_timeout,
                    email=email,
                )
                if not record:
                    return jsonify({'error': 'User profile not found'}), 403

                role_name = _normalize_role(record.get('role'))
                logging.info('Auth role resolved: user_id=%s role=%s status=%s', user_id, role_name, record.get('status'))
                founder = role_name == 'super_admin'
                if not role_name:
                    return jsonify({'error': 'Invalid application role'}), 403
                status = str(record.get('status', '')).strip().lower()
                if status not in {'active', 'approved'} and not founder:
                    return jsonify({'error': 'Account is not active'}), 403

                g.user = {
                    'uid': user_id,
                    'email': email,
                    'full_name': record.get('full_name'),
                    'role': role_name,
                    'protected': founder,
                    'is_owner': founder,
                    'status': record.get('status'),
                    'permissions': sorted(_permissions(record)),
                }
                if role:
                    allowed = role if isinstance(role, (list, tuple, set)) else [role]
                    allowed = {_normalize_role(item) for item in allowed}
                    if role_name not in allowed and not founder:
                        return jsonify({'error': 'Forbidden'}), 403
                return function(*args, **kwargs)
            except Exception as exc:
                logging.exception('Appwrite authentication failed')
                if optional:
                    g.user = None
                    return function(*args, **kwargs)
                return jsonify({'error': 'Invalid or expired Appwrite session'}), 401
        return wrapper
    return decorator


def require_permission(permission):
    """Require a persisted permission, while preserving the Founder override."""
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            if not getattr(g, 'user', None):
                return jsonify({'error': 'Missing Authorization token'}), 401
            if g.user.get('is_owner') or permission in g.user.get('permissions', set()):
                return function(*args, **kwargs)
            return jsonify({'error': 'Forbidden'}), 403
        return wrapper
    return decorator