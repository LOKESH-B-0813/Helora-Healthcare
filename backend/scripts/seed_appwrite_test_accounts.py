"""Idempotently provision persistent Helora Appwrite integration-test accounts."""
import json
import os
import secrets
import string
from datetime import datetime
from pathlib import Path

import requests
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.query import Query
from appwrite.services.users import Users

from app import create_app


EMAIL_DOMAIN = 'helora-test.example'
CREDENTIALS_PATH = Path(__file__).resolve().parents[2] / '.env.test.local'
PASSWORD_LENGTH = 24

TEST_ACCOUNTS = {
    'patient': {'email': f'helora.test.patient@{EMAIL_DOMAIN}', 'name': 'Helora Test Patient', 'role': 'patient'},
    'doctor': {'email': f'helora.test.doctor@{EMAIL_DOMAIN}', 'name': 'Helora Test Doctor', 'role': 'doctor'},
    'admin': {'email': f'helora.test.admin@{EMAIL_DOMAIN}', 'name': 'Helora Test Admin', 'role': 'admin'},
    'reception': {'email': f'helora.test.reception@{EMAIL_DOMAIN}', 'name': 'Helora Test Reception', 'role': 'employee'},
    'pharmacist': {'email': f'helora.test.pharmacist@{EMAIL_DOMAIN}', 'name': 'Helora Test Pharmacist', 'role': 'employee'},
}


def as_dict(value):
    if isinstance(value, dict):
        data = dict(value)
    elif hasattr(value, 'model_dump'):
        data = value.model_dump(by_alias=True)
    else:
        return {}
    if isinstance(data.get('data'), dict):
        data.update(data['data'])
    return data


def password():
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(alphabet) for _ in range(PASSWORD_LENGTH))


def load_passwords():
    values = {}
    if CREDENTIALS_PATH.exists():
        for line in CREDENTIALS_PATH.read_text().splitlines():
            if line.startswith('HELORA_TEST_') and '=' in line:
                key, value = line.split('=', 1)
                values[key] = value
    return values


def save_passwords(passwords):
    lines = [
        '# Generated locally by backend/scripts/seed_appwrite_test_accounts.py. Do not commit.',
        '# These are persistent Appwrite integration-test credentials.',
    ]
    lines.extend(f'HELORA_TEST_{key.upper()}_EMAIL={account["email"]}' for key, account in TEST_ACCOUNTS.items())
    lines.extend(f'HELORA_TEST_{key.upper()}_PASSWORD={passwords[key]}' for key in TEST_ACCOUNTS)
    CREDENTIALS_PATH.write_text('\n'.join(lines) + '\n')
    CREDENTIALS_PATH.chmod(0o600)


def find_auth_users(users_service):
    rows = as_dict(users_service.list(total=False, model_type=dict)).get('users', [])
    return {str(row.get('email', '')).lower(): as_dict(row) for row in rows}


def find_profile_rows(tables, database_id, users_table_id):
    rows = as_dict(tables.list_rows(database_id, users_table_id, total=False, model_type=dict)).get('rows', [])
    return rows


def row_by_user(rows, user_id):
    return next((row for row in rows if row.get('user_id') == user_id), None)


def upsert_profile(tables, database_id, table_id, existing, data):
    if existing:
        return as_dict(tables.update_row(database_id, table_id, existing['$id'], data, model_type=dict))
    return as_dict(tables.create_row(database_id, table_id, ID.unique(), data, model_type=dict))


def main():
    app = create_app()
    client = app.extensions['appwrite_client']
    tables = app.extensions['appwrite_tables_db']
    users_service = Users(client)
    database_id = app.extensions['appwrite_database_id']
    table_ids = app.extensions['appwrite_table_ids']
    users_table_id = app.extensions['appwrite_users_table_id']
    storage = app.extensions['appwrite_storage']
    bucket_id = app.extensions['appwrite_storage_bucket_id']

    passwords = load_passwords()
    auth_users = find_auth_users(users_service)
    profiles = find_profile_rows(tables, database_id, users_table_id)
    results = {}
    for key, account in TEST_ACCOUNTS.items():
        email = account['email'].lower()
        auth_user = auth_users.get(email)
        if not auth_user:
            passwords.setdefault(key, password())
            auth_user = as_dict(users_service.create(ID.unique(), email=email, password=passwords[key], name=account['name'], model_type=dict))
            auth_users[email] = auth_user
        else:
            passwords.setdefault(key, password())
        user_id = auth_user['$id']
        profile = upsert_profile(tables, database_id, users_table_id, row_by_user(profiles, user_id), {
            'user_id': user_id, 'email': email, 'full_name': account['name'], 'role': account['role'],
            'phone': '', 'profile_image': '', 'status': 'Active', 'permissions': '',
        })
        profiles = [row for row in profiles if row.get('$id') != profile.get('$id')] + [profile]
        results[key] = {'user_id': user_id, 'profile_id': profile.get('$id'), 'email': email, 'role': account['role']}

    doctor_id = results['doctor']['user_id']
    doctor_rows = as_dict(tables.list_rows(database_id, table_ids['doctor_profiles'], queries=[Query.equal('user_id', [doctor_id])], total=False, model_type=dict)).get('rows', [])
    doctor_profile = upsert_profile(tables, database_id, table_ids['doctor_profiles'], doctor_rows[0] if doctor_rows else None, {
        'user_id': doctor_id, 'specialization': 'Fictional Cardiology', 'qualification': 'MD Test Medicine',
        'license_number': 'HEL-TEST-DOC-001', 'experience_years': 8, 'consultation_fee': 0,
        'bio': 'Fictional integration-test doctor.', 'clinic_name': 'Helora Test Clinic',
        'clinic_address': '1 Test Avenue', 'availability': 'Weekdays', 'status': 'Active',
        'created_at': datetime.utcnow().isoformat() + 'Z', 'updated_at': datetime.utcnow().isoformat() + 'Z',
    })
    results['doctor_profile'] = {'row_id': doctor_profile.get('$id'), 'user_id': doctor_id}

    for key, employee_id, department, designation in (
        ('reception', 'HEL-EMP-TEST-001', 'Reception', 'Test Receptionist'),
        ('pharmacist', 'HEL-EMP-TEST-002', 'Pharmacy', 'Test Pharmacist'),
    ):
        uid = results[key]['user_id']
        employee_rows = as_dict(tables.list_rows(database_id, table_ids['employees'], queries=[Query.equal('user_id', [uid])], total=False, model_type=dict)).get('rows', [])
        employee = upsert_profile(tables, database_id, table_ids['employees'], employee_rows[0] if employee_rows else None, {
            'user_id': uid, 'employee_id': employee_id, 'department': department, 'designation': designation,
            'joining_date': None, 'status': 'Active', 'created_at': datetime.utcnow().isoformat() + 'Z',
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        })
        results[key + '_profile'] = {'row_id': employee.get('$id'), 'user_id': uid, 'employee_id': employee_id}

    patient_id = results['patient']['user_id']
    appointment_rows = as_dict(tables.list_rows(database_id, table_ids['appointments'], queries=[
        Query.equal('patient_id', [patient_id]), Query.equal('doctor_id', [doctor_id]),
    ], total=False, model_type=dict)).get('rows', [])
    appointment = upsert_profile(tables, database_id, table_ids['appointments'], appointment_rows[0] if appointment_rows else None, {
        'patient_id': patient_id, 'doctor_id': doctor_id, 'patient_name': 'Helora Test Patient',
        'doctor_name': 'Helora Test Doctor', 'appointment_date': '2030-01-15T10:00:00Z',
        'appointment_time': '10:00', 'appointment_type': 'integration_test', 'reason': 'Fictional test appointment',
        'status': 'accepted', 'doctor_notes': '', 'admin_notes': '', 'meeting_url': '',
        'created_by': patient_id, 'created_at': datetime.utcnow().isoformat() + 'Z', 'updated_at': datetime.utcnow().isoformat() + 'Z',
    })
    appointment_id = appointment['$id']
    results['appointment'] = {'row_id': appointment_id, 'patient_id': patient_id, 'doctor_id': doctor_id}

    consultation_rows = as_dict(tables.list_rows(database_id, table_ids['consultation_records'], queries=[Query.equal('appointment_id', [appointment_id])], total=False, model_type=dict)).get('rows', [])
    consultation = upsert_profile(tables, database_id, table_ids['consultation_records'], consultation_rows[0] if consultation_rows else None, {
        'patient_id': patient_id, 'doctor_id': doctor_id, 'appointment_id': appointment_id,
        'consultation_date': '2030-01-15T10:00:00Z', 'consultation_type': 'integration_test',
        'summary': 'Fictional test summary', 'clinical_notes': 'Fictional test notes', 'follow_up': 'None',
        'status': 'completed', 'created_at': datetime.utcnow().isoformat() + 'Z', 'updated_at': datetime.utcnow().isoformat() + 'Z',
    })
    results['consultation'] = {'row_id': consultation['$id']}

        prescription_rows = as_dict(tables.list_rows(database_id, table_ids['prescriptions'], queries=[Query.equal('consultation_id', [consultation['$id']])], total=False, model_type=dict)).get('rows', [])
    prescription = upsert_profile(tables, database_id, table_ids['prescriptions'], prescription_rows[0] if prescription_rows else None, {
        'patient_id': patient_id, 'doctor_id': doctor_id, 'consultation_id': consultation['$id'],
        'instructions': 'Fictional integration-test prescription', 'follow_up': 'None', 'status': 'active',
        'prescribed_at': '2030-01-15T10:30:00Z', 'created_at': datetime.utcnow().isoformat() + 'Z',
    })
    results['prescription'] = {'row_id': prescription['$id']}
    item_rows = as_dict(tables.list_rows(database_id, table_ids['prescription_items'], queries=[Query.equal('prescription_id', [prescription['$id'])], total=False, model_type=dict)).get('rows', [])
    item = upsert_profile(tables, database_id, table_ids['prescription_items'], item_rows[0] if item_rows else None, {
        'prescription_id': prescription['$id'], 'medicine_name': 'Fictional Test Medicine',
        'instructions': 'Integration test only', 'dosage': '1 unit', 'duration': '1 day', 'quantity': 1,
        'source': 'doctor_prescribed', 'created_at': datetime.utcnow().isoformat() + 'Z',
    })
    results['prescription_item'] = {'row_id': item['$id']}

    advice_rows = as_dict(tables.list_rows(database_id, table_ids['doctor_advice'], queries=[Query.equal('consultation_id', [consultation['$id'])], total=False, model_type=dict)).get('rows', [])
    advice = upsert_profile(tables, database_id, table_ids['doctor_advice'], advice_rows[0] if advice_rows else None, {
        'patient_id': patient_id, 'doctor_id': doctor_id, 'consultation_id': consultation['$id'],
        'advice': 'Fictional integration-test advice', 'created_at': datetime.utcnow().isoformat() + 'Z',
    })
    results['doctor_advice'] = {'row_id': advice['$id']}

    save_passwords(passwords)
    print(json.dumps({'credentials_file': str(CREDENTIALS_PATH), 'accounts': results}, indent=2))


if __name__ == '__main__':
    main()
