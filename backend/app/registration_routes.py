import logging

from appwrite.id import ID
from appwrite.services.users import Users
from flask import Blueprint, current_app, g, jsonify, request

from .auth import require_auth


registration_bp = Blueprint('registration_bp', __name__)


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


def _list_rows():
    tables = current_app.extensions.get('appwrite_tables_db')
    database_id = current_app.extensions.get('appwrite_database_id')
    table_id = current_app.extensions.get('appwrite_users_table_id')
    if not tables or not database_id or not table_id:
        return []
    try:
        result = tables.list_rows(database_id, table_id, total=False, model_type=dict)
        return [_as_dict(row) for row in _as_dict(result).get('rows', [])]
    except Exception:
        logging.exception('Helora user list failed')
        return []


def resolve_matching_user_row(existing_rows, user_id, email):
    """Return a single unambiguous Helora user row or mark duplicate matches."""
    normalized_user_id = str(user_id or '').strip()
    normalized_email = str(email or '').strip().lower()
    matches = []
    seen = set()

    for row in existing_rows:
        record = _as_dict(row)
        row_user_id = str(record.get('user_id') or '').strip()
        row_email = str(record.get('email') or '').strip().lower()
        is_match = bool(
            (normalized_user_id and row_user_id == normalized_user_id) or
            (normalized_email and row_email == normalized_email)
        )
        if not is_match:
            continue
        row_key = str(record.get('$id') or f'{row_user_id}:{row_email}')
        if row_key not in seen:
            seen.add(row_key)
            matches.append(record)

    if not matches:
        return None
    if len(matches) > 1:
        return {'conflict': True, 'matches': matches}
    return {'conflict': False, 'match': matches[0], 'matches': matches}


@registration_bp.route('/auth/patient/ensure', methods=['POST'])
@require_auth()
def ensure_patient_profile():
    body = request.get_json(silent=True) or {}
    email = str(body.get('email') or g.user.get('email') or '').strip().lower()
    full_name = str(body.get('full_name') or g.user.get('full_name') or '').strip() or email
    if not email:
        return jsonify({'success': False, 'error': 'Email is required.'}), 400

    tables = current_app.extensions.get('appwrite_tables_db')
    database_id = current_app.extensions.get('appwrite_database_id')
    table_id = current_app.extensions.get('appwrite_users_table_id')
    if not tables or not database_id or not table_id:
        return jsonify({'success': False, 'error': 'Appwrite registration is not configured'}), 503

    existing_rows = _list_rows()
    identity_match = resolve_matching_user_row(existing_rows, g.user.get('uid'), email)
    matched_row = identity_match.get('match') if isinstance(identity_match, dict) and identity_match.get('match') else None

    if identity_match and identity_match.get('conflict'):
        return jsonify({'success': False, 'error': 'Multiple Helora profile rows match this Google account. Please contact support.'}), 409

    if matched_row:
        role = str(matched_row.get('role', '')).lower()
        if role in {'admin', 'doctor'}:
            return jsonify({'success': False, 'error': 'This account is already associated with a non-patient Helora role.'}), 409
        if role == 'super_admin':
            return jsonify({'success': True, 'data': {'user_id': g.user.get('uid'), 'role': 'super_admin'}}), 200
        if role not in {'patient', ''}:
            return jsonify({'success': False, 'error': 'This account cannot be converted to a patient role.'}), 409

        try:
            tables.update_row(database_id, table_id, matched_row.get('$id'), {
                'user_id': g.user.get('uid'),
                'email': email,
                'full_name': full_name,
                'role': 'patient',
                'status': 'Active',
                'profile_image': matched_row.get('profile_image', ''),
                'phone': matched_row.get('phone', ''),
            }, model_type=dict)
        except Exception:
            logging.exception('Patient profile update failed')
            return jsonify({'success': False, 'error': 'Patient profile update failed.'}), 500

        return jsonify({'success': True, 'data': {'user_id': g.user.get('uid'), 'role': 'patient'}}), 200

    try:
        tables.create_row(database_id, table_id, ID.unique(), {
            'user_id': g.user.get('uid'),
            'email': email,
            'full_name': full_name,
            'role': 'patient',
            'phone': str(body.get('phone', '')).strip(),
            'profile_image': '',
            'status': 'Active',
        }, model_type=dict)
    except Exception:
        logging.exception('Patient profile creation failed')
        return jsonify({'success': False, 'error': 'Patient profile creation failed.'}), 500

    return jsonify({'success': True, 'data': {'user_id': g.user.get('uid'), 'role': 'patient'}}), 201


@registration_bp.route('/auth/register', methods=['POST'])
def register():
    body = request.get_json(silent=True) or {}
    email = str(body.get('email', '')).strip().lower()
    password = body.get('password')
    full_name = str(body.get('full_name', '')).strip()
    role = str(body.get('role', 'patient')).strip().lower()
    if role not in {'patient', 'doctor'}:
        return jsonify({'error': 'Registration is limited to patient and doctor accounts'}), 400
    if not email or not password or not full_name:
        return jsonify({'error': 'Email, password, and full name are required'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    client = current_app.extensions.get('appwrite_client')
    tables = current_app.extensions.get('appwrite_tables_db')
    database_id = current_app.extensions.get('appwrite_database_id')
    table_id = current_app.extensions.get('appwrite_users_table_id')
    if not client or not tables or not database_id or not table_id:
        return jsonify({'error': 'Appwrite registration is not configured'}), 503

    users = Users(client)
    created_user = None
    try:
        created_user = _as_dict(users.create(ID.unique(), email=email, password=password, name=full_name, model_type=dict))
        user_id = created_user.get('$id')
        if not user_id:
            raise RuntimeError('Appwrite user creation returned no user id')
        tables.create_row(database_id, table_id, ID.unique(), {
            'user_id': user_id,
            'email': email,
            'full_name': full_name,
            'role': role,
            'phone': str(body.get('phone', '')).strip(),
            'profile_image': '',
            'status': 'Active',
        }, model_type=dict)
        return jsonify({'success': True, 'data': {'user_id': user_id}}), 201
    except Exception as exc:
        logging.exception('Registration failed')
        if created_user and created_user.get('$id'):
            try:
                users.delete(created_user.get('$id'))
            except Exception:
                logging.exception('Registration rollback failed')
        return jsonify({'success': False, 'error': {'code': 'registration_failed', 'message': 'Registration could not be completed'}}), 500