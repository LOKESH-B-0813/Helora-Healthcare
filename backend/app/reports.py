"""Appwrite-backed compatibility routes for the health-record portal."""
import logging
from datetime import datetime
from io import BytesIO

from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.query import Query
from flask import Blueprint, current_app, g, jsonify, request, send_file

from .auth import require_auth


reports_bp = Blueprint('reports', __name__)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xlsx'}


def _db():
    return current_app.extensions['appwrite_database_id']


def _table(name):
    return current_app.extensions['appwrite_table_ids'][name]


def _tables():
    return current_app.extensions['appwrite_tables_db']


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


def _patient_access():
    if g.user.get('is_owner'):
        return None
    if g.user.get('role') != 'patient':
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Patient access required'}}), 403
    return g.user['uid']


@reports_bp.route('/reports/request-otp', methods=['POST'])
@reports_bp.route('/reports/verify-otp', methods=['POST'])
def otp_removed():
    return jsonify({'success': False, 'error': {
        'code': 'email_password_required',
        'message': 'Use the Appwrite email and password session for health records.',
    }}), 410


@reports_bp.route('/reports', methods=['GET'])
@require_auth()
def list_reports():
    patient_id = _patient_access()
    if isinstance(patient_id, tuple):
        return patient_id
    queries = None if patient_id is None else [Query.equal('patient_id', [patient_id])]
    try:
        result = _dict(_tables().list_rows(_db(), _table('medical_reports'), queries=queries, total=True, model_type=dict))
        return jsonify({'success': True, 'data': result.get('rows', []), 'total': result.get('total', 0)})
    except Exception:
        logging.exception('Failed to list Appwrite medical reports')
        return jsonify({'success': False, 'error': {'code': 'database_error', 'message': 'Unable to list reports'}}), 503


@reports_bp.route('/reports/<report_id>/download', methods=['GET'])
@require_auth()
def download_report(report_id):
    row = _dict(_tables().get_row(_db(), _table('medical_reports'), report_id, model_type=dict))
    if not row:
        return jsonify({'success': False, 'error': {'code': 'not_found', 'message': 'Report not found'}}), 404
    patient_id = _patient_access()
    if isinstance(patient_id, tuple):
        return patient_id
    if patient_id is not None and row.get('patient_id') != patient_id:
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Not authorized'}}), 403
    try:
        storage = current_app.extensions['appwrite_storage']
        bucket = current_app.extensions['appwrite_storage_bucket_id']
        content = storage.get_file_download(bucket, row['file_id'])
        return send_file(BytesIO(content), as_attachment=True, download_name=row.get('file_name') or 'medical-report', mimetype=row.get('file_type') or 'application/octet-stream')
    except Exception:
        logging.exception('Failed to download Appwrite medical report')
        return jsonify({'success': False, 'error': {'code': 'storage_error', 'message': 'Unable to download report'}}), 503


@reports_bp.route('/reports/upload', methods=['POST'])
@require_auth(role=['patient', 'super_admin'])
def upload_report():
    if not g.user.get('is_owner') and g.user.get('role') != 'patient':
        return jsonify({'success': False, 'error': {'code': 'forbidden', 'message': 'Patient access required'}}), 403
    file = request.files.get('document')
    filename = (file.filename or '').strip() if file else ''
    extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if not file or not filename or extension not in ALLOWED_EXTENSIONS:
        return jsonify({'success': False, 'error': {'code': 'invalid_file_type', 'message': 'File type is not supported'}}), 400
    content = file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        return jsonify({'success': False, 'error': {'code': 'file_too_large', 'message': 'File is too large'}}), 413
    file_id = ID.unique()
    storage = current_app.extensions['appwrite_storage']
    bucket = current_app.extensions['appwrite_storage_bucket_id']
    try:
        storage.create_file(bucket, file_id, InputFile.from_bytes(content, filename, file.mimetype or 'application/octet-stream'))
        row = _tables().create_row(_db(), _table('medical_reports'), ID.unique(), {
            'patient_id': g.user['uid'], 'doctor_id': '', 'uploaded_by': g.user['uid'], 'file_id': file_id,
            'file_name': filename, 'file_type': file.mimetype or 'application/octet-stream',
            'report_type': request.form.get('report_type', ''), 'description': request.form.get('description', ''),
            'report_date': None, 'created_at': datetime.utcnow().isoformat() + 'Z',
        }, model_type=dict)
        return jsonify({'success': True, 'data': _dict(row)}), 201
    except Exception:
        logging.exception('Failed to upload Appwrite medical report')
        try:
            storage.delete_file(bucket, file_id)
        except Exception:
            pass
        return jsonify({'success': False, 'error': {'code': 'upload_failed', 'message': 'Upload failed'}}), 503
