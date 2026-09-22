"""Tool-authorization and patient-privacy unit tests.

Appwrite access is simulated so no network calls happen during tests.
"""
import json

import pytest

from app.medi_ai.errors import AppointmentError, AppwriteUnavailableError
from app.medi_ai.tools.backend_tools import (
    _create_appointment_request,
    _get_current_medications,
    _get_patient_profile,
    _search_helora_doctors,
)
from app.medi_ai.tools.registry import create_default_registry
from app.medi_ai.tools.base import ToolContext


def make_user(uid, role='patient'):
    return {
        'uid': uid, 'email': f'{uid}@helora.test', 'full_name': f'User {uid}',
        'role': role, 'protected': False, 'is_owner': False,
        'status': 'active', 'permissions': [],
    }


USER_A = make_user('uid-a')
USER_B = make_user('uid-b')
DOCTOR = make_user('doc-1', role='doctor')

USERS = [
    {'user_id': 'uid-a', 'full_name': 'Alice', 'role': 'patient', 'status': 'active'},
    {'user_id': 'uid-b', 'full_name': 'Bob', 'role': 'patient', 'status': 'active'},
    {'user_id': 'doc-1', 'full_name': 'Dr Patel', 'role': 'doctor', 'status': 'active'},
]

PRESCRIPTIONS = [
    {'$id': 'rx-1', 'patient_id': 'uid-a', 'status': 'active', 'prescribed_at': '2026-09-01'},
]
PRESCRIPTION_ITEMS = [
    {'prescription_id': 'rx-1', 'medicine_name': 'Metformin', 'dosage': '500mg', 'duration': '30 days', 'instructions': 'With meals'},
]
DOCTOR_PROFILES = [
    {'user_id': 'doc-1', 'specialization': 'Cardiology', 'status': 'Active',
     'qualification': 'MD', 'experience_years': 10, 'consultation_fee': 500,
     'clinic_name': 'Helora Clinic', 'clinic_address': 'Chennai'},
]
APPOINTMENTS = []


class QueryFilter:
    @staticmethod
    def parse(queries=None):
        filters = []
        for q in queries or []:
            try:
                spec = json.loads(str(q))
            except Exception:
                continue
            method = spec.get('method')
            attr = spec.get('attribute')
            values = spec.get('values') or []
            if method == 'equal':
                filters.append(lambda row, a=attr, v=values: row.get(a) in v)
            elif method == 'notEqual':
                filters.append(lambda row, a=attr, v=values: row.get(a) not in v)
            elif method == 'search':
                filters.append(lambda row, a=attr, v=values: not v or any(
                    str(v[0]).lower() in str(row.get(a, '')).lower() for a in [a]
                ))
        return filters


class FakeTables:
    def __init__(self, rows):
        self._rows_data = rows
        self.created = []

    def list_rows(self, database_id, table_id, queries=None, total=False, model_type=dict):
        name = table_id
        rows = list(self._rows_data.get(name, []))
        filters = QueryFilter.parse(queries)
        filtered = [r for r in rows if all(f(r) for f in filters)]
        return {'rows': filtered, 'total': len(filtered)}

    def create_row(self, database_id, table_id, document_id, data, model_type=dict):
        self.created.append(data)
        return {'$id': document_id, **data}


def default_rows():
    return {
        'users': USERS,
        'prescriptions': PRESCRIPTIONS,
        'prescription_items': PRESCRIPTION_ITEMS,
        'doctor_profiles': DOCTOR_PROFILES,
        'appointments': [],
        'medical_reports': [],
        'consultation_records': [],
    }


@pytest.fixture
def fake_aws(monkeypatch):
    tables = FakeTables(default_rows())
    monkeypatch.setattr('app.medi_ai.tools.backend_tools._tables', lambda: tables)
    monkeypatch.setattr('app.medi_ai.tools.backend_tools._database', lambda: 'db-test')
    monkeypatch.setattr('app.medi_ai.tools.backend_tools._table', lambda name: name)
    monkeypatch.setattr('app.medi_ai.tools.backend_tools._require_appwrite', lambda: None)
    return tables


def test_patient_own_medications(fake_aws, monkeypatch):
    result = _get_current_medications({}, ToolContext(user=USER_A))
    assert result.success
    names = [m['medicine_name'] for m in result.data['medications']]
    assert 'Metformin' in names


def test_other_patient_does_not_see_medicines(fake_aws, monkeypatch):
    # uid-b asks for their own medications; the underlying query is filtered by
    # the authenticated uid, so Alice's row is never loaded.
    result = _get_current_medications({}, ToolContext(user=USER_B))
    assert result.success
    assert result.data['medications'] == []


def test_profile_from_authenticated_session_only(fake_aws):
    result = _get_patient_profile({}, ToolContext(user=USER_A))
    assert result.success
    assert result.data['full_name'] == 'Alice'


def test_doctor_search_omits_contact_fields(fake_aws, monkeypatch):
    result = _search_helora_doctors({'specialty': 'Cardiology'}, ToolContext(user=DOCTOR))
    assert result.success
    assert result.data['doctors']
    for doctor in result.data['doctors']:
        plain = ' '.join(str(v) for v in doctor.values())
        assert 'email' not in plain and 'phone' not in plain
        assert 'Dr ' in doctor['full_name']


def test_appointment_rejects_unknown_doctor(fake_aws):
    with pytest.raises(AppointmentError):
        _create_appointment_request(
            {'doctor_id': 'not-a-real-doctor', 'appointment_date': '2026-10-01', 'appointment_time': '10:00'},
            ToolContext(user=USER_A),
        )


def test_appointment_requires_patient_columns(fake_aws):
    with pytest.raises(AppointmentError):
        _create_appointment_request(
            {'doctor_id': '', 'appointment_date': '', 'appointment_time': ''},
            ToolContext(user=USER_A),
        )


def test_registry_role_gating_for_doctor():
    from app.medi_ai.errors import ToolAuthorizationError
    registry = create_default_registry()
    ctx = ToolContext(user=DOCTOR)
    # Patient-owner tools are forbidden for non-patient roles.
    assert registry.get('get_current_medications').enabled
    with pytest.raises(ToolAuthorizationError):
        registry.execute('get_current_medications', {}, ctx)


def test_disabled_tools_are_skipped():
    registry = create_default_registry()
    assert registry.get('get_prescriptions').enabled is False
    assert registry.get('get_available_appointments').enabled is False
    assert registry.get('handoff_to_doctor').enabled is False


def test_appwrite_unavailable_is_safe(fake_aws, monkeypatch):
    def no_appwrite():
        raise AppwriteUnavailableError()

    monkeypatch.setattr('app.medi_ai.tools.backend_tools._require_appwrite', no_appwrite)
    with pytest.raises(AppwriteUnavailableError):
        _get_patient_profile({}, ToolContext(user=USER_A))