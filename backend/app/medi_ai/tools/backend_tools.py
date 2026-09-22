"""Backend tool handlers.

All patient data access derives the identity from ``g.user`` (the real
authenticated session) - a client-supplied patient ID is never trusted.
Appwrite credentials stay server-side; the LLM never sees raw records or
credentials.
"""
import logging
from datetime import datetime

from appwrite.id import ID
from appwrite.query import Query
from flask import current_app

from ..errors import (
    AppointmentError,
    AppwriteUnavailableError,
    ForbiddenError,
)
from .base import Tool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _tables():
    return current_app.extensions.get('appwrite_tables_db')


def _database():
    return current_app.extensions.get('appwrite_database_id')


def _table(name):
    return current_app.extensions.get('appwrite_table_ids', {}).get(name, name)


def _as_dict(value):
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
    tables = _tables()
    if not tables or not _database():
        raise AppwriteUnavailableError()
    result = tables.list_rows(
        _database(), _table(table_name), queries=queries, total=True, model_type=dict,
    )
    data = _as_dict(result)
    return data.get('rows', []), data.get('total', 0)


def _require_appwrite():
    if not (_tables() and _database() and _table('users')):
        raise AppwriteUnavailableError()


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def _own_user_row(uid: str):
    rows, _ = _rows('users', [Query.equal('user_id', [uid])])
    if not rows:
        raise ForbiddenError()
    return rows[0]


def _clamp_int(value, default, minimum=1, maximum=10):
    try:
        return max(minimum, min(maximum, int(value)))
    except (TypeError, ValueError):
        return default


def _safe_report_meta(row):
    return {
        'report_type': row.get('report_type', ''),
        'file_name': row.get('file_name', ''),
        'file_type': row.get('file_type', ''),
        'report_date': row.get('report_date', ''),
        'description': row.get('description', ''),
        'created_at': row.get('created_at', ''),
        'doctor_id': row.get('doctor_id', ''),
    }


# --------------------------------------------------------------------------
# Handlers
# --------------------------------------------------------------------------
def _get_patient_profile(params, ctx: ToolContext):
    _require_appwrite()
    row = _own_user_row(ctx.user['uid'])
    return ToolResult(success=True, data={
        'full_name': row.get('full_name'),
        'role': row.get('role'),
        'status': row.get('status'),
        'profile_image': row.get('profile_image'),
        'phone': row.get('phone'),
        'email': row.get('email'),
    })


def _get_recent_medical_reports(params, ctx: ToolContext):
    _require_appwrite()
    limit = _clamp_int(params.get('limit'), 5)
    rows, _ = _rows('medical_reports', [
        Query.equal('patient_id', [ctx.user['uid']]),
    ])
    rows = sorted(rows, key=lambda r: r.get('created_at', ''), reverse=True)[:limit]
    payload = [_safe_report_meta(row) for row in rows]
    return ToolResult(success=True, data={'reports': payload, 'total': len(payload)})


def _get_report_metadata(params, ctx: ToolContext):
    """Report metadata for the authenticated patient, no file contents."""
    _require_appwrite()
    rows, _ = _rows('medical_reports', [
        Query.equal('patient_id', [ctx.user['uid']]),
    ])
    payload = [_safe_report_meta(row) for row in rows]
    return ToolResult(success=True, data={'reports': payload, 'total': len(payload)})


def _get_recent_consultations(params, ctx: ToolContext):
    _require_appwrite()
    limit = _clamp_int(params.get('limit'), 5)
    rows, _ = _rows('consultation_records', [
        Query.equal('patient_id', [ctx.user['uid']]),
    ])
    rows = sorted(rows, key=lambda r: r.get('created_at', ''), reverse=True)[:limit]
    payload = []
    for row in rows:
        summary = str(row.get('summary', ''))
        payload.append({
            'consultation_date': row.get('consultation_date', ''),
            'consultation_type': row.get('consultation_type', ''),
            'status': row.get('status', ''),
            'doctor_id': row.get('doctor_id', ''),
            'summary': summary[:300],
        })
    return ToolResult(success=True, data={'consultations': payload, 'total': len(payload)})


def _get_current_medications(params, ctx: ToolContext):
    """Medication names from the patient's prescriptions (opened by a real doctor)."""
    _require_appwrite()
    rows, _ = _rows('prescriptions', [
        Query.equal('patient_id', [ctx.user['uid']]),
        Query.equal('status', ['active']),
    ])
    medications = []
    for prescription in rows[:10]:
        items, _ = _rows('prescription_items', [
            Query.equal('prescription_id', [prescription.get('$id')]),
        ])
        for item in items:
            medications.append({
                'medicine_name': item.get('medicine_name', ''),
                'dosage': item.get('dosage', ''),
                'duration': item.get('duration', ''),
                'instructions': item.get('instructions', ''),
                'prescribed_at': prescription.get('prescribed_at', ''),
            })
    return ToolResult(success=True, data={'medications': medications, 'total': len(medications)})


def _get_prescriptions(params, ctx: ToolContext):
    from ..errors import MediAIError
    raise MediAIError('get_prescriptions is not yet enabled. Use get_current_medications.')


def _search_helora_doctors(params, ctx: ToolContext):
    _require_appwrite()
    specialty = str(params.get('specialty', '')).strip()
    name_query = str(params.get('name', '')).strip().lower()
    limit = _clamp_int(params.get('limit'), 8)

    profiles, _ = _rows('doctor_profiles', [Query.equal('status', ['Active'])])
    payload = []
    for profile in profiles:
        specialization = str(profile.get('specialization', ''))
        if specialty and specialty.lower() not in specialization.lower():
            continue
        user_row = None
        try:
            user_rows, _ = _rows('users', [Query.equal('user_id', [profile.get('user_id')])])
            user_row = user_rows[0] if user_rows else None
        except Exception:
            logger.exception('Doctor user lookup failed')
        full_name = (user_row or {}).get('full_name', '')
        if name_query and name_query not in full_name.lower():
            continue
        # Contact details are intentionally never returned by searches.
        payload.append({
            'doctor_id': profile.get('user_id'),
            'full_name': full_name,
            'specialization': specialization,
            'qualification': profile.get('qualification', ''),
            'experience_years': profile.get('experience_years'),
            'consultation_fee': profile.get('consultation_fee'),
            'clinic_name': profile.get('clinic_name', ''),
            'clinic_address': profile.get('clinic_address', ''),
        })
        if len(payload) >= limit:
            break
    return ToolResult(success=True, data={'doctors': payload, 'total': len(payload)})


def _create_appointment_request(params, ctx: ToolContext):
    """Create a pending appointment for the authenticated patient.

    The doctor_id must resolve to a real doctor profile (never invented);
    the model cannot fabricate doctor IDs because this handler validates them.
    """
    _require_appwrite()
    doctor_id = str(params.get('doctor_id', '')).strip()
    appointment_date = str(params.get('appointment_date', '')).strip()
    appointment_time = str(params.get('appointment_time', '')).strip()
    appointment_type = str(params.get('appointment_type', '')).strip() or 'in-person'
    reason = str(params.get('reason', '')).strip()
    if not doctor_id or not appointment_date or not appointment_time:
        raise AppointmentError('doctor_id, appointment_date and appointment_time are required')

    # validate doctor exists and is Active
    doctor_rows, _ = _rows('doctor_profiles', [
        Query.equal('user_id', [doctor_id]),
        Query.equal('status', ['Active']),
    ])
    if not doctor_rows:
        raise AppointmentError('The selected doctor is not available.')

    patient_row = _own_user_row(ctx.user['uid'])
    doctor_user_rows, _ = _rows('users', [Query.equal('user_id', [doctor_id])])
    doctor_name = ''
    if doctor_user_rows:
        doctor_name = doctor_user_rows[0].get('full_name', '') or doctor_user_rows[0].get('email', '')

    now = datetime.utcnow().isoformat() + 'Z'
    data = {
        'patient_id': ctx.user['uid'],
        'doctor_id': doctor_id,
        'patient_name': patient_row.get('full_name', ''),
        'doctor_name': doctor_name,
        'specialization': doctor_rows[0].get('specialization', ''),
        'appointment_date': appointment_date,
        'appointment_time': appointment_time,
        'appointment_type': appointment_type,
        'reason': reason,
        'status': 'pending',
        'created_by': ctx.user['uid'],
        'created_at': now,
        'updated_at': now,
    }
    try:
        row = _as_dict(_tables().create_row(_database(), _table('appointments'), ID.unique(), data, model_type=dict))
    except Exception:
        logger.exception('Appointment request creation failed via Appwrite')
        raise AppwriteUnavailableError()
    return ToolResult(success=True, data={
        'appointment_id': row.get('$id'),
        'status': 'pending',
        'doctor_id': doctor_id,
        'doctor_name': doctor_name,
        'appointment_date': appointment_date,
        'appointment_time': appointment_time,
    })


# --------------------------------------------------------------------------
# Tool definitions
# --------------------------------------------------------------------------
DEFAULT_TOOLS = [
    Tool(
        name='get_patient_profile',
        description='Returns the authenticated patient profile (own data only).',
        handler=_get_patient_profile,
        required_roles=['patient'],
    ),
    Tool(
        name='get_recent_medical_reports',
        description='Returns metadata of the authenticated patient recent medical reports.',
        handler=_get_recent_medical_reports,
        required_roles=['patient'],
        param_schema={'limit': {'type': 'integer', 'default': 5}},
    ),
    Tool(
        name='get_report_metadata',
        description='Returns metadata for all of the authenticated patient medical reports.',
        handler=_get_report_metadata,
        required_roles=['patient'],
    ),
    Tool(
        name='get_recent_consultations',
        description='Returns recent consultation summaries for the authenticated patient.',
        handler=_get_recent_consultations,
        required_roles=['patient'],
        param_schema={'limit': {'type': 'integer', 'default': 5}},
    ),
    Tool(
        name='get_current_medications',
        description='Returns current prescribed medications for the authenticated patient.',
        handler=_get_current_medications,
        required_roles=['patient'],
    ),
    Tool(
        name='get_prescriptions',
        description='Prescription listing - reserved for a later integration.',
        handler=_get_prescriptions,
        required_roles=['patient'],
        enabled=False,
    ),
    Tool(
        name='search_helora_doctors',
        description='Searches real Helora doctor profiles by specialty or name.',
        handler=_search_helora_doctors,
        param_schema={
            'specialty': {'type': 'string'},
            'name': {'type': 'string'},
            'limit': {'type': 'integer', 'default': 8},
        },
    ),
    Tool(
        name='create_appointment_request',
        description='Creates a pending appointment request for the authenticated patient.',
        handler=_create_appointment_request,
        required_roles=['patient'],
        param_schema={
            'doctor_id': {'type': 'string', 'required': True},
            'appointment_date': {'type': 'string', 'required': True},
            'appointment_time': {'type': 'string', 'required': True},
            'appointment_type': {'type': 'string', 'default': 'in-person'},
            'reason': {'type': 'string'},
        },
    ),
    Tool(
        name='get_available_appointments',
        description='Availability check - reserved for a later integration with the scheduling service.',
        handler=lambda params, ctx: ToolResult(
            success=False, error_code='not_available',
            error_message='Availability is not available yet.', available=False,
        ),
        enabled=False,
    ),
    Tool(
        name='handoff_to_doctor',
        description='Doctor handoff - reserved for a future supervised workflow.',
        handler=lambda params, ctx: ToolResult(
            success=False, error_code='not_available',
            error_message='Doctor handoff is not available yet.', available=False,
        ),
        enabled=False,
    ),
]