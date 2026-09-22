"""Privacy-scoped patient health record APIs."""
import logging
import mimetypes
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

import requests
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.query import Query
from flask import Blueprint, current_app, g, jsonify, request, send_file

from .auth import require_auth


health_bp = Blueprint('health_bp', __name__)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
REPORT_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xlsx'}
IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def _db():
    return current_app.extensions['appwrite_database_id']


def _table(name):
    return current_app.extensions['appwrite_table_ids'][name]


def _tables():
    return current_app.extensions['appwrite_tables_db']


def _storage():
    return current_app.extensions['appwrite_storage'], current_app.extensions['appwrite_storage_bucket_id']


def _file_details(file, allowed_extensions):
    filename = (file.filename or '').strip()
    extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if not filename or extension not in allowed_extensions:
        return None, 'File type is not supported'
    if request.content_length and request.content_length > MAX_UPLOAD_BYTES:
        return None, 'File is too large'
    content = file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        return None, 'File is too large'
    mimetype = file.mimetype or mimetypes.guess_type(filename)[0] or 'application/octet-stream'
    return (filename, extension, mimetype, content), None


def _user_row(user_id):
    rows, _ = _rows('users', [Query.equal('user_id', [user_id])])
    return rows[0] if rows else None


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


def _rows(table, queries):
    return _rows_from_config(
        table,
        queries,
        current_app.config['APPWRITE_ENDPOINT'],
        current_app.config['APPWRITE_PROJECT_ID'],
        current_app.config['APPWRITE_API_KEY'],
        _db(),
        _table(table),
        current_app.config.get('APPWRITE_REQUEST_TIMEOUT_SECONDS', 8),
    )


def _rows_from_config(table, queries, endpoint, project_id, api_key, database_id, table_id, timeout):
    params = [('total', 'false')]
    for query in queries or []:
        params.append(('queries[]', query))
    response = requests.get(
        f'{endpoint.rstrip("/")}/tablesdb/{database_id}/tables/{table_id}/rows',
        headers={
            'X-Appwrite-Project': project_id,
            'X-Appwrite-Key': api_key,
        },
        params=params,
        timeout=min(timeout, 4),
    )
    response.raise_for_status()
    data = response.json()
    rows = data.get('rows', [])
    return rows, len(rows)


def _audit(action, resource_type, resource_id=None):
    try:
        _tables().create_row(_db(), _table('audit_logs'), ID.unique(), {
            'actor_id': g.user['uid'], 'actor_name': g.user.get('full_name') or g.user.get('email'),
            'actor_role': g.user['role'], 'action': action, 'resource_type': resource_type,
            'resource_id': resource_id or '', 'details': '', 'ip_address': request.remote_addr or '',
            'created_at': datetime.utcnow().isoformat() + 'Z',
        }, model_type=dict)
    except Exception:
        logging.exception('Clinical audit write failed')


def _patient_id():
    return g.user['uid']


def _owner_or_patient():
    if g.user.get('is_owner'):
        return None
    if g.user.get('role') != 'patient':
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Patient access required'}}), 403
    return _patient_id()


@health_bp.route('/health-record/profile', methods=['GET'])
@require_auth()
def profile():
    patient_id = _owner_or_patient()
    if isinstance(patient_id, tuple):
        return patient_id
    if patient_id is None:
        patient_id = _patient_id()
    rows, _ = _rows('users', [Query.equal('user_id', [patient_id])])
    if not rows:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'Profile not found'}}), 404
    row = rows[0]
    return jsonify({'success': True, 'data': {
        'user_id': row.get('user_id'), 'full_name': row.get('full_name'), 'role': row.get('role'),
        'phone': row.get('phone'), 'profile_image': row.get('profile_image'), 'status': row.get('status'),
    }})


@health_bp.route('/health-record/profile-image', methods=['POST', 'DELETE'])
@require_auth()
def profile_image():
    if g.user.get('is_owner'):
        user_id = g.user['uid']
    elif g.user.get('role') in {'patient', 'doctor', 'employee'}:
        user_id = g.user['uid']
    else:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Profile image access denied'}}), 403
    try:
        row = _user_row(user_id)
    except Exception:
        logging.exception('Failed to load profile image owner')
        return jsonify({'success': False, 'error': {'code': 'database_error', 'message': 'Unable to load profile'}}), 503
    if not row:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'Profile not found'}}), 404
    storage, bucket = _storage()
    old_file_id = row.get('profile_image') or ''
    if request.method == 'DELETE':
        _tables().update_row(_db(), _table('users'), row['$id'], {'profile_image': ''}, model_type=dict)
        if old_file_id:
            try:
                storage.delete_file(bucket, old_file_id)
            except Exception:
                logging.exception('Failed to delete old profile image')
        return jsonify({'success': True, 'data': {'profile_image': ''}})

    details, error = _file_details(request.files.get('image'), IMAGE_EXTENSIONS) if request.files.get('image') else (None, 'Image is required')
    if error:
        return jsonify({'success': False, 'error': {'code': 'invalid_file', 'message': error}}), 400
    filename, _, mimetype, content = details
    file_id = ID.unique()
    try:
        storage.create_file(bucket, file_id, InputFile.from_bytes(content, filename, mimetype))
        _tables().update_row(_db(), _table('users'), row['$id'], {'profile_image': file_id}, model_type=dict)
        if old_file_id:
            try:
                storage.delete_file(bucket, old_file_id)
            except Exception:
                logging.exception('Failed to delete replaced profile image')
        return jsonify({'success': True, 'data': {'profile_image': file_id}})
    except Exception:
        logging.exception('Profile image update failed')
        try:
            storage.delete_file(bucket, file_id)
        except Exception:
            pass
        return jsonify({'success': False, 'error': {'code': 'upload_failed', 'message': 'Profile image update failed'}}), 500


@health_bp.route('/health-record/records', methods=['GET'])
@require_auth()
def records():
    patient_id = _owner_or_patient()
    if isinstance(patient_id, tuple):
        return patient_id
    if patient_id is None:
        patient_id = _patient_id()
    endpoint = current_app.config['APPWRITE_ENDPOINT']
    project_id = current_app.config['APPWRITE_PROJECT_ID']
    api_key = current_app.config['APPWRITE_API_KEY']
    database_id = _db()
    timeout = current_app.config.get('APPWRITE_REQUEST_TIMEOUT_SECONDS', 8)
    owner = g.user.get('is_owner')
    patient_query = lambda name: None if owner else [Query.equal('user_id' if name == 'notifications' else 'patient_id', [patient_id])]
    names = ('appointments', 'medical_reports', 'pharmacy_records', 'insurance_records', 'notifications', 'prescriptions')
    result = {name: {'data': [], 'total': 0, 'error': 'unavailable'} for name in names}
    futures = {}
    with ThreadPoolExecutor(max_workers=len(names)) as executor:
        for name in names:
            futures[executor.submit(
                _rows_from_config,
                name,
                patient_query(name),
                endpoint,
                project_id,
                api_key,
                database_id,
                _table(name),
                timeout,
            )] = name
        for future in as_completed(futures):
            name = futures[future]
            try:
                rows, total = future.result()
                result[name] = {'data': rows, 'total': total}
            except Exception:
                logging.exception('Health record read failed for %s', name)
                result[name] = {'data': [], 'total': 0, 'error': 'unavailable'}

    prescription_items = []
    prescriptions = result['prescriptions']['data']
    with ThreadPoolExecutor(max_workers=max(1, min(8, len(prescriptions)))) as executor:
        item_futures = {
            executor.submit(
                _rows_from_config,
                'prescription_items',
                [Query.equal('prescription_id', [prescription.get('$id')])],
                endpoint,
                project_id,
                api_key,
                database_id,
                _table('prescription_items'),
                timeout,
            ): prescription.get('$id')
            for prescription in prescriptions
            if prescription.get('$id')
        }
        for future in as_completed(item_futures):
            try:
                rows, _ = future.result()
                prescription_items.extend(rows)
            except Exception:
                logging.exception('Prescription item read failed for %s', item_futures[future])

    result['prescription_items'] = {'data': prescription_items, 'total': len(prescription_items)}
    result['medical_records'] = {'data': result['medical_reports']['data'], 'total': result['medical_reports']['total']}
    result['lab_reports'] = {'data': result['medical_reports']['data'], 'total': result['medical_reports']['total']}
    result['profile'] = {
        'user_id': g.user.get('uid'),
        'full_name': g.user.get('full_name'),
        'email': g.user.get('email'),
        'role': g.user.get('role'),
        'status': g.user.get('status'),
    }
    return jsonify({'success': True, 'data': result})


@health_bp.route('/health-record/reports', methods=['POST'])
@require_auth(role=['patient', 'super_admin'])
def upload_report():
    if not g.user.get('is_owner') and g.user.get('role') != 'patient':
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Patient access required'}}), 403
    file = request.files.get('document')
    if not file or not file.filename:
        return jsonify({'success': False, 'error': {'code': 'invalid_file', 'message': 'Document is required'}}), 400
    details, error = _file_details(file, REPORT_EXTENSIONS)
    if error:
        return jsonify({'success': False, 'error': {'code': 'invalid_file', 'message': error}}), 400
    filename, ext, mimetype, content = details
    patient_id = _patient_id()
    storage, bucket = _storage()
    file_id = ID.unique()
    try:
        storage.create_file(bucket, file_id, InputFile.from_bytes(content, filename, mimetype))
        row = _tables().create_row(_db(), _table('medical_reports'), ID.unique(), {
            'patient_id': patient_id, 'doctor_id': '', 'uploaded_by': g.user['uid'], 'file_id': file_id,
            'file_name': filename, 'file_type': mimetype or ext, 'report_type': request.form.get('report_type', ''),
            'description': request.form.get('description', ''), 'report_date': None, 'created_at': datetime.utcnow().isoformat() + 'Z',
        }, model_type=dict)
        return jsonify({'success': True, 'data': _dict(row)}), 201
    except Exception:
        logging.exception('Health report upload failed')
        try:
            storage.delete_file(bucket, file_id)
        except Exception:
            pass
        return jsonify({'success': False, 'error': {'code': 'upload_failed', 'message': 'Report upload failed'}}), 500


@health_bp.route('/health-record/reports/<report_id>/download', methods=['GET'])
@require_auth()
def download_report(report_id):
    try:
        row = _dict(_tables().get_row(_db(), _table('medical_reports'), report_id, model_type=dict))
    except Exception:
        logging.exception('Failed to load report metadata')
        return jsonify({'success': False, 'error': {'code': 'database_error', 'message': 'Unable to load report'}}), 503
    if not row:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'Report not found'}}), 404
    patient_id = row.get('patient_id')
    allowed = g.user.get('is_owner') or patient_id == g.user.get('uid')
    if g.user.get('role') == 'doctor' and not allowed:
        appointments, _ = _rows('appointments', [
            Query.equal('doctor_id', [g.user['uid']]), Query.equal('patient_id', [patient_id]),
        ])
        allowed = any(item.get('status') in {'accepted', 'completed', 'reschedule_requested'} for item in appointments)
    if not allowed:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Not authorized to access this report'}}), 403
    try:
        storage, bucket = _storage()
        content = storage.get_file_download(bucket, row['file_id'])
        return send_file(BytesIO(content), as_attachment=True, download_name=row.get('file_name') or 'medical-report', mimetype=row.get('file_type') or 'application/octet-stream')
    except Exception:
        logging.exception('Report download failed')
        return jsonify({'success': False, 'error': {'code': 'download_failed', 'message': 'Unable to download report'}}), 500


@health_bp.route('/doctor/clinical/<patient_id>', methods=['GET'])
@require_auth(role='doctor')
def doctor_clinical_view(patient_id):
    """Expose only the minimum clinical data for an accepted/completed care relationship."""
    if g.user.get('is_owner'):
        relationship = True
    else:
        appointments, _ = _rows('appointments', [
            Query.equal('doctor_id', [g.user['uid']]),
            Query.equal('patient_id', [patient_id]),
        ])
        relationship = any(row.get('status') in {'accepted', 'completed', 'reschedule_requested'} for row in appointments)
    if not relationship:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'No authorized care relationship'}}), 403

    reports, _ = _rows('medical_reports', [Query.equal('patient_id', [patient_id])])
    pharmacy, _ = _rows('pharmacy_records', [Query.equal('patient_id', [patient_id])])
    appointments, _ = _rows('appointments', [Query.equal('patient_id', [patient_id])])
    consultations, _ = _rows('consultation_records', [Query.equal('patient_id', [patient_id])])
    prescriptions, _ = _rows('prescriptions', [Query.equal('patient_id', [patient_id])])
    advice, _ = _rows('doctor_advice', [Query.equal('patient_id', [patient_id])])
    prescription_items = []
    for prescription in prescriptions:
        items, _ = _rows('prescription_items', [Query.equal('prescription_id', [prescription.get('$id')])])
        prescription_items.extend(items)
    _safe_reports = [{key: row.get(key) for key in ('file_name', 'file_type', 'report_type', 'description', 'report_date', 'created_at', 'doctor_id')} for row in reports]
    return jsonify({'success': True, 'data': {
        'patient': {'patient_id': patient_id},
        'reports': _safe_reports,
        'pharmacy_records': pharmacy,
        'appointments': appointments,
        'consultations': consultations,
        'prescriptions': prescriptions,
        'prescription_items': prescription_items,
        'doctor_advice': advice,
    }})


def _clinical_relationship(patient_id, appointment_id=None, consultation_id=None):
    if g.user.get('is_owner'):
        return True, None
    if g.user.get('role') != 'doctor':
        return False, 'Doctor access required'
    if consultation_id:
        consultation = _tables().get_row(_db(), _table('consultation_records'), consultation_id, model_type=dict)
        consultation = _dict(consultation)
        if consultation.get('patient_id') == patient_id and consultation.get('doctor_id') == g.user['uid']:
            return True, None
    if appointment_id:
        appointment = _tables().get_row(_db(), _table('appointments'), appointment_id, model_type=dict)
        appointment = _dict(appointment)
        if appointment.get('patient_id') == patient_id and appointment.get('doctor_id') == g.user['uid'] and appointment.get('status') in {'accepted', 'completed', 'reschedule_requested'}:
            return True, None
    return False, 'No authorized care relationship'


@health_bp.route('/doctor/clinical/<patient_id>/consultations', methods=['POST'])
@require_auth(role='doctor')
def create_consultation(patient_id):
    body = request.get_json(silent=True) or {}
    allowed, error = _clinical_relationship(patient_id, body.get('appointment_id'))
    if not allowed:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': error}}), 403
    required = ('consultation_date', 'consultation_type', 'status')
    if any(not body.get(key) for key in required):
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Consultation date, type, and status are required'}}), 400
    doctor_id = g.user['uid'] if not g.user.get('is_owner') else body.get('doctor_id')
    if not doctor_id:
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Doctor identity is required'}}), 400
    data = {
        'patient_id': patient_id, 'doctor_id': doctor_id, 'appointment_id': body.get('appointment_id', ''),
        'consultation_date': body['consultation_date'], 'consultation_type': body['consultation_type'],
        'summary': body.get('summary', ''), 'clinical_notes': body.get('clinical_notes', ''),
        'follow_up': body.get('follow_up', ''), 'status': body['status'],
        'created_at': datetime.utcnow().isoformat() + 'Z', 'updated_at': datetime.utcnow().isoformat() + 'Z',
    }
    try:
        row = _dict(_tables().create_row(_db(), _table('consultation_records'), ID.unique(), data, model_type=dict))
        _audit('consultation_created', 'consultation_record', row.get('$id'))
        return jsonify({'success': True, 'data': row}), 201
    except Exception:
        logging.exception('Consultation creation failed')
        return jsonify({'success': False, 'error': {'code': 'consultation_create_failed', 'message': 'Unable to create consultation'}}), 500


@health_bp.route('/doctor/clinical/<patient_id>/prescriptions', methods=['POST'])
@require_auth(role='doctor')
def create_prescription(patient_id):
    body = request.get_json(silent=True) or {}
    items = body.get('items')
    if not isinstance(items, list) or not items:
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'At least one medicine item is required'}}), 400
    allowed, error = _clinical_relationship(patient_id, body.get('appointment_id'), body.get('consultation_id'))
    if not allowed:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': error}}), 403
    doctor_id = g.user['uid'] if not g.user.get('is_owner') else body.get('doctor_id')
    if not doctor_id:
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Doctor identity is required'}}), 400
    prescription_id = ID.unique()
    created_items = []
    try:
        prescription = _dict(_tables().create_row(_db(), _table('prescriptions'), prescription_id, {
            'patient_id': patient_id, 'doctor_id': doctor_id, 'consultation_id': body.get('consultation_id', ''),
            'instructions': body.get('instructions', ''), 'follow_up': body.get('follow_up', ''), 'status': 'active',
            'prescribed_at': body.get('prescribed_at') or datetime.utcnow().isoformat() + 'Z', 'created_at': datetime.utcnow().isoformat() + 'Z',
        }, model_type=dict))
        for item in items:
            if not item.get('medicine_name'):
                raise ValueError('Every prescription item needs medicine_name')
            created_items.append(_dict(_tables().create_row(_db(), _table('prescription_items'), ID.unique(), {
                'prescription_id': prescription_id, 'medicine_name': item['medicine_name'], 'instructions': item.get('instructions', ''),
                'dosage': item.get('dosage', ''), 'duration': item.get('duration', ''), 'quantity': item.get('quantity'),
                'source': 'doctor_prescribed', 'created_at': datetime.utcnow().isoformat() + 'Z',
            }, model_type=dict)))
        _audit('prescription_created', 'prescription', prescription_id)
        return jsonify({'success': True, 'data': {'prescription': prescription, 'items': created_items}}), 201
    except Exception:
        logging.exception('Prescription creation failed')
        try:
            for item in created_items:
                _tables().delete_row(_db(), _table('prescription_items'), item.get('$id'))
            _tables().delete_row(_db(), _table('prescriptions'), prescription_id)
        except Exception:
            logging.exception('Prescription rollback failed')
        return jsonify({'success': False, 'error': {'code': 'prescription_create_failed', 'message': 'Unable to create prescription'}}), 500


@health_bp.route('/doctor/clinical/<patient_id>/advice', methods=['POST'])
@require_auth(role='doctor')
def create_advice(patient_id):
    body = request.get_json(silent=True) or {}
    allowed, error = _clinical_relationship(patient_id, body.get('appointment_id'), body.get('consultation_id'))
    if not allowed:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': error}}), 403
    advice = str(body.get('advice', '')).strip()
    if not advice:
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Advice is required'}}), 400
    doctor_id = g.user['uid'] if not g.user.get('is_owner') else body.get('doctor_id')
    if not doctor_id:
        return jsonify({'success': False, 'error': {'code': 'invalid_input', 'message': 'Doctor identity is required'}}), 400
    try:
        row = _dict(_tables().create_row(_db(), _table('doctor_advice'), ID.unique(), {
            'patient_id': patient_id, 'doctor_id': doctor_id, 'consultation_id': body.get('consultation_id', ''),
            'advice': advice, 'created_at': datetime.utcnow().isoformat() + 'Z',
        }, model_type=dict))
        _audit('doctor_advice_created', 'doctor_advice', row.get('$id'))
        return jsonify({'success': True, 'data': row}), 201
    except Exception:
        logging.exception('Doctor advice creation failed')
        return jsonify({'success': False, 'error': {'code': 'advice_create_failed', 'message': 'Unable to create advice'}}), 500