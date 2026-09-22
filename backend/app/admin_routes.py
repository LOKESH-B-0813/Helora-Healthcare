import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from appwrite.id import ID
from appwrite.services.users import Users
from appwrite.query import Query
from flask import Blueprint, current_app, g, jsonify, request
import requests

from .auth import require_auth, require_permission


admin_bp = Blueprint('admin_bp', __name__)


def _tables():
    return current_app.extensions.get('appwrite_tables_db')


def _ids():
    return (current_app.extensions.get('appwrite_database_id'), current_app.extensions.get('appwrite_users_table_id'))


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


def _user_rows():
    tables = _tables()
    database_id, table_id = _ids()
    if not tables or not database_id or not table_id:
        raise RuntimeError('Appwrite users table is not configured')
    result = tables.list_rows(database_id, table_id, total=False, model_type=dict)
    return [_as_dict(row) for row in _as_dict(result).get('rows', [])]


def _find_user_row(user_id):
    rows = _user_rows()
    for row in rows:
        if str(row.get('user_id')) == str(user_id):
            return row
    return None


def _appwrite_get(path):
    endpoint = current_app.config['APPWRITE_ENDPOINT'].rstrip('/')
    response = requests.get(
        endpoint + path,
        headers={
            'X-Appwrite-Project': current_app.config['APPWRITE_PROJECT_ID'],
            'X-Appwrite-Key': current_app.config['APPWRITE_API_KEY'],
        },
        timeout=current_app.config.get('APPWRITE_HEALTH_TIMEOUT_SECONDS', 5),
    )
    response.raise_for_status()
    return response.json()


def _audit(action, target_uid, details=''):
    try:
        _tables().create_row(
            current_app.extensions['appwrite_database_id'],
            current_app.extensions['appwrite_table_ids']['audit_logs'],
            ID.unique(),
            {
                'actor_id': g.user['uid'], 'actor_name': g.user.get('full_name') or g.user.get('email'),
                'actor_role': g.user['role'], 'action': action, 'resource_type': 'user',
                'resource_id': target_uid, 'details': details, 'ip_address': request.remote_addr or '',
                'created_at': datetime.utcnow().isoformat() + 'Z',
            }, model_type=dict,
        )
    except Exception:
        logging.exception('Admin audit write failed')


def _permission_set(value):
    if isinstance(value, list):
        return sorted({str(item).strip() for item in value if str(item).strip()})
    return sorted({item.strip() for item in str(value or '').split(',') if item.strip()})


def _create_profile_row(data):
    return _tables().create_row(
        current_app.extensions['appwrite_database_id'],
        current_app.extensions['appwrite_users_table_id'],
        ID.unique(), data, model_type=dict,
    )


@admin_bp.route('/admin/users', methods=['POST'])
@require_auth(role=['super_admin', 'admin'])
@require_permission('users.create')
def create_user():
    body = request.get_json(silent=True) or {}
    email = str(body.get('email', '')).strip().lower()
    full_name = str(body.get('full_name', '')).strip()
    password = body.get('password')
    role = str(body.get('role', '')).strip().lower().replace('-', '_')
    allowed_roles = {'admin', 'doctor', 'employee', 'patient'}
    if role not in allowed_roles:
        return jsonify({'success': False, 'error': {'code': 'invalid_role', 'message': 'Unsupported account role'}}), 400
    if not email or '@' not in email or not full_name or not isinstance(password, str) or len(password) < 8:
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Valid email, full name, and password of at least 8 characters are required'}}), 400
    if role == 'doctor' and not str(body.get('specialization', '')).strip():
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Doctor specialization is required'}}), 400
    if role == 'employee' and (not str(body.get('department', '')).strip() or not str(body.get('designation', '')).strip()):
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Employee department and designation are required'}}), 400
    if role == 'admin' and not g.user.get('is_owner'):
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Only the Founder can create administrators'}}), 403

    existing = next((row for row in _user_rows() if str(row.get('email', '')).lower() == email), None)
    if existing:
        return jsonify({'success': False, 'error': {'code': 'duplicate_email', 'message': 'An application profile already exists for this email'}}), 409

    users = Users(current_app.extensions['appwrite_client'])
    created_user = None
    created_rows = []
    try:
        created_user = _as_dict(users.create(ID.unique(), email=email, password=password, name=full_name, model_type=dict))
        uid = created_user.get('$id')
        profile = _as_dict(_create_profile_row({
            'user_id': uid, 'email': email, 'full_name': full_name, 'role': role,
            'phone': str(body.get('phone', '')).strip(), 'profile_image': '', 'status': 'Active',
            'permissions': ','.join(_permission_set(body.get('permissions', []))),
        }))
        created_rows.append((current_app.extensions['appwrite_users_table_id'], profile.get('$id')))
        if role == 'doctor':
            doctor = _as_dict(_tables().create_row(current_app.extensions['appwrite_database_id'], current_app.extensions['appwrite_table_ids']['doctor_profiles'], ID.unique(), {
                'user_id': uid, 'specialization': str(body['specialization']).strip(), 'qualification': str(body.get('qualification', '')).strip(),
                'license_number': str(body.get('license_number', '')).strip(), 'experience_years': body.get('experience_years'),
                'consultation_fee': body.get('consultation_fee'), 'bio': str(body.get('bio', '')).strip(), 'clinic_name': '', 'clinic_address': '',
                'availability': '', 'status': 'Active', 'created_at': datetime.utcnow().isoformat() + 'Z', 'updated_at': datetime.utcnow().isoformat() + 'Z',
            }, model_type=dict))
            created_rows.append((current_app.extensions['appwrite_table_ids']['doctor_profiles'], doctor.get('$id')))
        if role == 'employee':
            employee = _as_dict(_tables().create_row(current_app.extensions['appwrite_database_id'], current_app.extensions['appwrite_table_ids']['employees'], ID.unique(), {
                'user_id': uid, 'employee_id': str(body.get('employee_id', '')).strip(), 'department': str(body['department']).strip(),
                'designation': str(body['designation']).strip(), 'joining_date': body.get('joining_date'), 'status': 'Active',
                'created_at': datetime.utcnow().isoformat() + 'Z', 'updated_at': datetime.utcnow().isoformat() + 'Z',
            }, model_type=dict))
            created_rows.append((current_app.extensions['appwrite_table_ids']['employees'], employee.get('$id')))
        _audit('user_created', uid, role)
        return jsonify({'success': True, 'data': {'user_id': uid, 'role': role}}), 201
    except Exception:
        logging.exception('Admin user creation failed')
        for table_id, row_id in reversed(created_rows):
            if row_id:
                try:
                    _tables().delete_row(current_app.extensions['appwrite_database_id'], table_id, row_id)
                except Exception:
                    logging.exception('Profile rollback failed')
        if created_user and created_user.get('$id'):
            try:
                users.delete(created_user['$id'])
            except Exception:
                logging.exception('Auth rollback failed')
        return jsonify({'success': False, 'error': {'code': 'account_create_failed', 'message': 'Account creation could not be completed'}}), 500


@admin_bp.route('/admin/auth/verify', methods=['GET'])
@require_auth()
def verify():
    return jsonify({'ok': True, 'user': g.user})


@admin_bp.route('/admin/auth/logout', methods=['POST'])
@require_auth()
def logout():
    return jsonify({'ok': True, 'message': 'Appwrite logout acknowledged'})


@admin_bp.route('/admin/profile', methods=['GET'])
@require_auth()
def profile():
    return jsonify({'ok': True, 'profile': g.user})


@admin_bp.route('/admin/users', methods=['GET'])
@require_auth(role=['super_admin', 'admin'])
@require_permission('users.read')
def list_users():
    try:
        return jsonify({'ok': True, 'users': _user_rows()})
    except Exception as exc:
        logging.exception('Failed to list Appwrite users')
        return jsonify({'error': 'Failed to list users', 'detail': str(exc)}), 500


@admin_bp.route('/admin/users/<uid>/role', methods=['POST'])
@require_auth(role='super_admin')
def set_user_role(uid):
    body = request.get_json(force=True, silent=True) or {}
    new_role = str(body.get('role', '')).strip().lower().replace('-', '_')
    if new_role not in {'super_admin', 'admin', 'doctor', 'patient', 'employee'}:
        return jsonify({'error': 'Invalid role'}), 400
    if new_role == 'super_admin' and not g.user.get('is_owner'):
        return jsonify({'error': 'Only the Founder can assign super_admin'}), 403

    try:
        target = _find_user_row(uid)
        if not target:
            return jsonify({'error': 'User profile not found'}), 404
        if str(target.get('role', '')).lower() == 'super_admin' or (target.get('user_id') == g.user.get('uid') and g.user.get('protected')):
            return jsonify({'error': 'Cannot modify protected Super Admin'}), 403

        tables = _tables()
        database_id, table_id = _ids()
        tables.update_row(database_id, table_id, target.get('$id'), {'role': new_role})
        _audit('user_role_changed', uid, new_role)
        return jsonify({'ok': True})
    except Exception as exc:
        logging.exception('Failed to update Appwrite user role')
        return jsonify({'error': 'Failed to set role', 'detail': str(exc)}), 500


@admin_bp.route('/admin/users/<uid>', methods=['PATCH'])
@require_auth(role=['super_admin', 'admin'])
@require_permission('users.update')
def update_user_profile(uid):
    target = _find_user_row(uid)
    if not target:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'User profile not found'}}), 404
    if str(target.get('role', '')).lower() == 'super_admin':
        return jsonify({'success': False, 'error': {'code': 'protected_user', 'message': 'Founder account is immutable'}}), 403
    body = request.get_json(silent=True) or {}
    allowed = {'full_name', 'phone', 'profile_image'}
    updates = {key: str(body[key]).strip() for key in allowed if key in body}
    if not updates:
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'No editable profile fields supplied'}}), 400
    updates['updated_at'] = datetime.utcnow().isoformat() + 'Z'
    updated = _tables().update_row(current_app.extensions['appwrite_database_id'], current_app.extensions['appwrite_users_table_id'], target.get('$id'), updates, model_type=dict)
    _audit('user_profile_changed', uid, ','.join(sorted(updates)))
    return jsonify({'success': True, 'data': _as_dict(updated)})


@admin_bp.route('/admin/users/<uid>/status', methods=['PATCH'])
@require_auth(role=['super_admin', 'admin'])
@require_permission('users.deactivate')
def set_user_status(uid):
    status = str((request.get_json(silent=True) or {}).get('status', '')).strip()
    if status not in {'active', 'inactive', 'suspended'}:
        return jsonify({'success': False, 'error': {'code': 'invalid_status', 'message': 'Invalid account status'}}), 400
    target = _find_user_row(uid)
    if not target:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'User profile not found'}}), 404
    if str(target.get('role', '')).lower() == 'super_admin':
        return jsonify({'success': False, 'error': {'code': 'protected_user', 'message': 'Founder account is immutable'}}), 403
    client = current_app.extensions['appwrite_client']
    Users(client).update_status(uid, status in {'active', 'approved'}, model_type=dict)
    lifecycle = {'status': status}
    if status in {'inactive', 'suspended'}:
        lifecycle['terminated_at'] = None
    updated = _tables().update_row(current_app.extensions['appwrite_database_id'], current_app.extensions['appwrite_users_table_id'], target.get('$id'), lifecycle, model_type=dict)
    _audit('user_status_changed', uid, status)
    return jsonify({'success': True, 'data': _as_dict(updated)})


@admin_bp.route('/admin/users/<uid>/permissions', methods=['PATCH'])
@require_auth(role='super_admin')
@require_permission('users.permissions')
def set_user_permissions(uid):
    target = _find_user_row(uid)
    if not target:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'User profile not found'}}), 404
    if str(target.get('role', '')).lower() == 'super_admin':
        return jsonify({'success': False, 'error': {'code': 'protected_user', 'message': 'Founder permissions are immutable'}}), 403
    requested = (request.get_json(silent=True) or {}).get('permissions', [])
    if not isinstance(requested, list) or any(not isinstance(item, str) for item in requested):
        return jsonify({'success': False, 'error': {'code': 'invalid_permissions', 'message': 'Permissions must be a string array'}}), 400
    value = ','.join(sorted(set(item.strip() for item in requested if item.strip())))
    updated = _tables().update_row(current_app.extensions['appwrite_database_id'], current_app.extensions['appwrite_users_table_id'], target.get('$id'), {'permissions': value}, model_type=dict)
    _audit('user_permissions_changed', uid, value)
    return jsonify({'success': True, 'data': _as_dict(updated)})


@admin_bp.route('/admin/users/<uid>/terminate', methods=['POST'])
@require_auth(role='super_admin')
@require_permission('users.update')
def terminate_user(uid):
    target = _find_user_row(uid)
    if not target:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'User profile not found'}}), 404
    if str(target.get('role', '')).lower() == 'super_admin':
        return jsonify({'success': False, 'error': {'code': 'protected_user', 'message': 'Founder account is immutable'}}), 403
    reason = str((request.get_json(silent=True) or {}).get('reason', '')).strip()
    now = datetime.utcnow().isoformat() + 'Z'
    Users(current_app.extensions['appwrite_client']).update_status(uid, False, model_type=dict)
    updated = _tables().update_row(current_app.extensions['appwrite_database_id'], current_app.extensions['appwrite_users_table_id'], target.get('$id'), {'status': 'terminated', 'terminated_at': now, 'termination_reason': reason}, model_type=dict)
    _audit('user_terminated', uid, reason)
    return jsonify({'success': True, 'data': _as_dict(updated)})


@admin_bp.route('/admin/roles', methods=['GET'])
@require_auth(role=['super_admin', 'admin'])
def list_roles():
    return jsonify({'ok': True, 'roles': ['super_admin', 'admin', 'doctor', 'patient', 'employee']})


@admin_bp.route('/admin/dashboard', methods=['GET'])
@require_auth(role=['super_admin', 'admin'])
def dashboard():
    try:
        database_id, table_id = _ids()
        table_ids = current_app.extensions['appwrite_table_ids']
        requests_to_make = {
            'users': f'/tablesdb/{database_id}/tables/{table_id}/rows',
            'appointments': f'/tablesdb/{database_id}/tables/{table_ids["appointments"]}/rows',
            'medical_reports': f'/tablesdb/{database_id}/tables/{table_ids["medical_reports"]}/rows',
            'pharmacy_records': f'/tablesdb/{database_id}/tables/{table_ids["pharmacy_records"]}/rows',
            'insurance_records': f'/tablesdb/{database_id}/tables/{table_ids["insurance_records"]}/rows',
            'notifications': f'/tablesdb/{database_id}/tables/{table_ids["notifications"]}/rows',
            'database': f'/databases/{database_id}',
            'users_table': f'/tablesdb/{database_id}/tables/{table_id}',
            'storage_bucket': f'/storage/buckets/{current_app.config["APPWRITE_STORAGE_BUCKET_ID"]}',
            'audit_logs': f'/tablesdb/{database_id}/tables/{table_ids["audit_logs"]}/rows',
        }

        results = {}
        with ThreadPoolExecutor(max_workers=len(requests_to_make)) as executor:
            futures = {executor.submit(_appwrite_get, path): name for name, path in requests_to_make.items()}
            for future in as_completed(futures):
                name = futures[future]
                try:
                    results[name] = future.result()
                except Exception as exc:
                    logging.warning('Dashboard Appwrite %s check failed: %s', name, type(exc).__name__)
                    results[name] = None

        users_payload = results.get('users') or {}
        users = users_payload.get('rows', [])
        roles = [str(user.get('role', '')).lower() for user in users]
        domain_counts = {
            table_name: (results.get(table_name) or {}).get('total')
            for table_name in ('appointments', 'medical_reports', 'pharmacy_records', 'insurance_records', 'notifications')
        }

        recent_activity = sorted(
            [
                {
                    'type': 'user_profile',
                    'email': user.get('email'),
                    'role': str(user.get('role', '')).lower(),
                    'created_at': user.get('$createdAt'),
                }
                for user in users
                if user.get('$createdAt')
            ],
            key=lambda item: item.get('created_at') or '',
            reverse=True,
        )[:10]
        role_distribution = {role: roles.count(role) for role in ('super_admin', 'admin', 'doctor', 'patient', 'employee')}
        status_checks = {
            name: {'ok': bool(resource), 'id': resource.get('$id') if resource else None}
            for name, resource in ((name, results.get(name)) for name in ('database', 'users_table', 'storage_bucket'))
        }
        status = {'ok': all(check['ok'] for check in status_checks.values()), 'checks': status_checks}
        audit_payload = results.get('audit_logs') or {}
        audit_rows = audit_payload.get('rows', [])
        if audit_rows:
            recent_activity = sorted(audit_rows, key=lambda item: item.get('created_at') or '', reverse=True)[:10]
        response = {'ok': True, 'stats': {
            'total_users': len(users),
            'total_doctors': roles.count('doctor'),
            'total_patients': roles.count('patient'),
            'total_admins': roles.count('admin') + roles.count('super_admin'),
            'total_employees': roles.count('employee'),
            'total_appointments': domain_counts['appointments'],
            'total_medical_reports': domain_counts['medical_reports'],
            'total_pharmacy_records': domain_counts['pharmacy_records'],
            'total_insurance_records': domain_counts['insurance_records'],
            'total_notifications': domain_counts['notifications'],
            'active_users': sum(1 for user in users if str(user.get('status', '')).lower() == 'active'),
        }, 'role_distribution': role_distribution, 'recent_activity': recent_activity,
            'appointments': {'available': domain_counts['appointments'] is not None, 'count': domain_counts['appointments']},
            'system_status': {
                'backend': {'ok': True},
                'appwrite': {'ok': status.get('ok', False)},
                'database': status.get('checks', {}).get('database', {'ok': False}),
                'storage': status.get('checks', {}).get('storage_bucket', {'ok': False}),
            }}
        return jsonify(response)
    except Exception as exc:
        logging.exception('Failed to compute Appwrite dashboard stats')
        return jsonify({'error': 'Failed to compute dashboard stats', 'detail': str(exc)}), 500


@admin_bp.route('/admin/records/<resource>', methods=['GET'])
@require_auth(role=['super_admin', 'admin'])
def records(resource):
    table_map = {
        'patients': 'users', 'doctors': 'users', 'administrators': 'users', 'employees': 'employees',
        'appointments': 'appointments', 'reports': 'medical_reports', 'pharmacy': 'pharmacy_records',
        'insurance': 'insurance_records', 'notifications': 'notifications', 'audit': 'audit_logs',
    }
    if resource not in table_map:
        return jsonify({'success': False, 'error': {'code': 'invalid_resource', 'message': 'Unknown admin resource'}}), 404
    try:
        table_name = table_map[resource]
        if table_name == 'users':
            rows = _appwrite_get(f'/tablesdb/{current_app.extensions["appwrite_database_id"]}/tables/{current_app.extensions["appwrite_users_table_id"]}/rows').get('rows', [])
            role_map = {'patients': {'patient'}, 'doctors': {'doctor'}, 'administrators': {'admin', 'super_admin'}}
            rows = [row for row in rows if row.get('role') in role_map[resource]]
            if resource == 'doctors':
                profiles = _appwrite_get(f'/tablesdb/{current_app.extensions["appwrite_database_id"]}/tables/{current_app.extensions["appwrite_table_ids"]["doctor_profiles"]}/rows').get('rows', [])
                by_user = {profile.get('user_id'): profile for profile in profiles}
                rows = [{**row, **{f'doctor_{key}': value for key, value in by_user.get(row.get('user_id'), {}).items() if not key.startswith('$')}} for row in rows]
            total = len(rows)
        else:
            result = _tables().list_rows(
                current_app.extensions['appwrite_database_id'],
                current_app.extensions['appwrite_table_ids'][table_name],
                total=True,
                model_type=dict,
            )
            payload = _as_dict(result)
            rows = payload.get('rows', [])
            total = payload.get('total', len(rows))
        return jsonify({'success': True, 'data': rows, 'total': total})
    except Exception:
        logging.exception('Failed to read admin resource %s', resource)
        return jsonify({'success': False, 'error': {'code': 'resource_read_failed', 'message': 'Unable to load resource'}}), 500

