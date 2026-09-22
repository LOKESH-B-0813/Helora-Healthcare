from datetime import datetime
import logging

from appwrite.id import ID
from appwrite.query import Query
from flask import Blueprint, current_app, g, jsonify, request

from .auth import require_auth


domain_bp = Blueprint('domain_bp', __name__)
APPOINTMENT_STATUSES = {'pending', 'accepted', 'rejected', 'reschedule_requested', 'completed', 'cancelled'}


def _tables():
    return current_app.extensions['appwrite_tables_db']


def _table(name):
    return current_app.extensions['appwrite_table_ids'].get(name, name)


def _database():
    return current_app.extensions['appwrite_database_id']


def _dict(value):
    if isinstance(value, dict):
        result = dict(value)
    elif hasattr(value, 'model_dump'):
        result = value.model_dump(by_alias=True)
    else:
        return {}
    if isinstance(result.get('data'), dict):
        result.update(result['data'])
    return result


def _rows(table_name, queries=None):
    result = _tables().list_rows(_database(), _table(table_name), queries=queries, total=True, model_type=dict)
    data = _dict(result)
    return data.get('rows', []), data.get('total', 0)


def _audit(action, resource_type, resource_id=None, details=None):
    actor = g.user
    try:
        _tables().create_row(_database(), _table('audit_logs'), ID.unique(), {
            'actor_id': actor['uid'], 'actor_name': actor.get('full_name') or actor.get('email'),
            'actor_role': actor['role'], 'action': action, 'resource_type': resource_type,
            'resource_id': resource_id or '', 'details': details or '',
            'ip_address': request.remote_addr or '', 'created_at': datetime.utcnow().isoformat() + 'Z',
        }, model_type=dict)
    except Exception:
        logging.exception('Audit write failed')


def _notify(user_id, title, message, notification_type, related_id=''):
    if not user_id:
        return
    _tables().create_row(_database(), _table('notifications'), ID.unique(), {
        'user_id': user_id, 'title': title, 'message': message, 'type': notification_type,
        'is_read': False, 'related_id': related_id, 'created_at': datetime.utcnow().isoformat() + 'Z',
    }, model_type=dict)


@domain_bp.route('/appointments', methods=['GET'])
@require_auth()
def list_appointments():
    user = g.user
    queries = []
    if user['role'] == 'patient' and not user.get('is_owner'):
        queries.append(Query.equal('patient_id', [user['uid']]))
    elif user['role'] == 'doctor' and not user.get('is_owner'):
        queries.append(Query.equal('doctor_id', [user['uid']]))
    rows, total = _rows('appointments', queries)
    return jsonify({'success': True, 'data': rows, 'total': total})


@domain_bp.route('/appointments', methods=['POST'])
@require_auth(role=['patient', 'super_admin'])
def create_appointment():
    body = request.get_json(silent=True) or {}
    required = ('patient_id', 'doctor_id', 'patient_name', 'doctor_name', 'appointment_date', 'appointment_time', 'appointment_type', 'created_by')
    if any(not body.get(key) for key in required):
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Missing required appointment fields'}}), 400
    if not g.user.get('is_owner') and body['patient_id'] != g.user['uid']:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Cannot create for another patient'}}), 403
    data = {key: body.get(key, '') for key in ('patient_id', 'doctor_id', 'patient_name', 'doctor_name', 'appointment_date', 'appointment_time', 'appointment_type', 'reason')}
    data.update({'status': 'pending', 'doctor_notes': '', 'admin_notes': '', 'meeting_url': '', 'created_by': g.user['uid'], 'created_at': datetime.utcnow().isoformat() + 'Z', 'updated_at': datetime.utcnow().isoformat() + 'Z'})
    try:
        row = _dict(_tables().create_row(_database(), _table('appointments'), ID.unique(), data, model_type=dict))
        _notify(data['doctor_id'], 'New appointment request', f"Appointment request from {data['patient_name']}", 'appointment', row.get('$id'))
        _audit('appointment_created', 'appointment', row.get('$id'))
        return jsonify({'success': True, 'data': row}), 201
    except Exception as exc:
        logging.exception('Appointment creation failed')
        return jsonify({'success': False, 'error': {'code': 'appointment_create_failed', 'message': 'Unable to create appointment'}}), 500


@domain_bp.route('/appointments/<appointment_id>/status', methods=['PATCH'])
@require_auth()
def update_appointment_status(appointment_id):
    body = request.get_json(silent=True) or {}
    status = body.get('status')
    if status not in APPOINTMENT_STATUSES:
        return jsonify({'success': False, 'error': {'code': 'invalid_status', 'message': 'Unsupported appointment status'}}), 400
    row = _dict(_tables().get_row(_database(), _table('appointments'), appointment_id, model_type=dict))
    if not row:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'Appointment not found'}}), 404
    user = g.user
    allowed = user.get('is_owner') or user['role'] in {'admin', 'super_admin'}
    if user['role'] == 'doctor' and row.get('doctor_id') == user['uid']:
        allowed = True
    if user['role'] == 'patient' and row.get('patient_id') == user['uid'] and status == 'cancelled':
        allowed = True
    if not allowed:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Not authorized for this appointment'}}), 403
    updated = _dict(_tables().update_row(_database(), _table('appointments'), appointment_id, {'status': status, 'updated_at': datetime.utcnow().isoformat() + 'Z'}, model_type=dict))
    target_id = row.get('patient_id') if user['role'] == 'doctor' else row.get('doctor_id')
    _notify(target_id, 'Appointment updated', f"Appointment status changed to {status}", 'appointment', appointment_id)
    _audit('appointment_status_changed', 'appointment', appointment_id, status)
    return jsonify({'success': True, 'data': updated})


@domain_bp.route('/notifications', methods=['GET'])
@require_auth()
def notifications():
    rows, total = _rows('notifications', [Query.equal('user_id', [g.user['uid']])] if not g.user.get('is_owner') else None)
    return jsonify({'success': True, 'data': rows, 'total': total})


@domain_bp.route('/notifications/<notification_id>/read', methods=['PATCH'])
@require_auth()
def mark_notification_read(notification_id):
    row = _dict(_tables().get_row(_database(), _table('notifications'), notification_id, model_type=dict))
    if not row or (not g.user.get('is_owner') and row.get('user_id') != g.user['uid']):
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Not authorized'}}), 403
    updated = _dict(_tables().update_row(_database(), _table('notifications'), notification_id, {'is_read': True}, model_type=dict))
    return jsonify({'success': True, 'data': updated})


@domain_bp.route('/admin/audit', methods=['GET'])
@require_auth(role='super_admin')
def admin_audit():
    rows, total = _rows('audit_logs')
    return jsonify({'success': True, 'data': rows, 'total': total})