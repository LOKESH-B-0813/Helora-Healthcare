"""Idempotent Appwrite TablesDB schema provisioning.

This is an explicit bootstrap operation. It is never called from a normal
request and never deletes or rewrites existing tables, columns, or rows.
"""
from datetime import datetime


DOMAIN_TABLES = {
    'consultation_records': {
        'columns': [
            ('text', 'patient_id', True), ('text', 'doctor_id', True), ('text', 'appointment_id', False),
            ('datetime', 'consultation_date', True), ('text', 'consultation_type', True),
            ('text', 'summary', False), ('text', 'clinical_notes', False), ('text', 'follow_up', False),
            ('text', 'status', True), ('datetime', 'created_at', True), ('datetime', 'updated_at', True),
        ],
        'indexes': [('consultations_patient_key', 'key', ['patient_id']), ('consultations_doctor_key', 'key', ['doctor_id']), ('consultations_date_key', 'key', ['consultation_date'])],
    },
    'prescriptions': {
        'columns': [
            ('text', 'patient_id', True), ('text', 'doctor_id', True), ('text', 'consultation_id', False),
            ('text', 'instructions', False), ('text', 'follow_up', False), ('text', 'status', True),
            ('datetime', 'prescribed_at', True), ('datetime', 'created_at', True),
        ],
        'indexes': [('prescriptions_patient_key', 'key', ['patient_id']), ('prescriptions_doctor_key', 'key', ['doctor_id']), ('prescriptions_consultation_key', 'key', ['consultation_id'])],
    },
    'prescription_items': {
        'columns': [
            ('text', 'prescription_id', True), ('text', 'medicine_name', True), ('text', 'instructions', False),
            ('text', 'dosage', False), ('text', 'duration', False), ('integer', 'quantity', False),
            ('text', 'source', True), ('datetime', 'created_at', True),
        ],
        'indexes': [('prescription_items_prescription_key', 'key', ['prescription_id']), ('prescription_items_medicine_key', 'key', ['medicine_name'])],
    },
    'doctor_advice': {
        'columns': [
            ('text', 'patient_id', True), ('text', 'doctor_id', True), ('text', 'consultation_id', False),
            ('text', 'advice', True), ('datetime', 'created_at', True),
        ],
        'indexes': [('advice_patient_key', 'key', ['patient_id']), ('advice_doctor_key', 'key', ['doctor_id']), ('advice_consultation_key', 'key', ['consultation_id'])],
    },
    'users': {
        'columns': [
            ('datetime', 'created_at', False), ('datetime', 'updated_at', False),
            ('text', 'permissions', False), ('datetime', 'terminated_at', False), ('text', 'termination_reason', False),
        ],
        'indexes': [
            ('users_user_id_unique', 'unique', ['user_id']),
            ('users_email_unique', 'unique', ['email']),
            ('users_role_key', 'key', ['role']),
            ('users_status_key', 'key', ['status']),
        ],
    },
    'doctor_profiles': {
        'columns': [
            ('text', 'user_id', True), ('text', 'specialization', True), ('text', 'qualification', False),
            ('text', 'license_number', False), ('integer', 'experience_years', False),
            ('float', 'consultation_fee', False), ('text', 'bio', False), ('text', 'clinic_name', False),
            ('text', 'clinic_address', False), ('text', 'availability', False), ('text', 'status', True),
            ('datetime', 'created_at', True), ('datetime', 'updated_at', True),
        ],
        'indexes': [('doctor_profiles_user_id_unique', 'unique', ['user_id']), ('doctor_profiles_status_key', 'key', ['status'])],
    },
    'employees': {
        'columns': [
            ('text', 'user_id', True), ('text', 'employee_id', False), ('text', 'department', True),
            ('text', 'designation', True), ('datetime', 'joining_date', False), ('text', 'status', True),
            ('datetime', 'created_at', True), ('datetime', 'updated_at', True),
        ],
        'indexes': [('employees_user_id_unique', 'unique', ['user_id']), ('employees_status_key', 'key', ['status'])],
    },
    'appointments': {
        'columns': [
            ('text', 'patient_id', True), ('text', 'doctor_id', True), ('text', 'patient_name', True),
            ('text', 'doctor_name', True), ('datetime', 'appointment_date', True), ('text', 'appointment_time', True),
            ('text', 'appointment_type', True), ('text', 'reason', False), ('text', 'status', True),
            ('text', 'doctor_notes', False), ('text', 'admin_notes', False), ('url', 'meeting_url', False),
            ('text', 'created_by', True), ('datetime', 'created_at', True), ('datetime', 'updated_at', True),
        ],
        'indexes': [
            ('appointments_patient_key', 'key', ['patient_id']), ('appointments_doctor_key', 'key', ['doctor_id']),
            ('appointments_status_key', 'key', ['status']), ('appointments_date_key', 'key', ['appointment_date']),
        ],
    },
    'notifications': {
        'columns': [
            ('text', 'user_id', True), ('text', 'title', True), ('text', 'message', True), ('text', 'type', True),
            ('boolean', 'is_read', True), ('text', 'related_id', False), ('datetime', 'created_at', True),
        ],
        'indexes': [('notifications_user_key', 'key', ['user_id']), ('notifications_read_key', 'key', ['is_read'])],
    },
    'audit_logs': {
        'columns': [
            ('text', 'actor_id', True), ('text', 'actor_name', False), ('text', 'actor_role', True),
            ('text', 'action', True), ('text', 'resource_type', True), ('text', 'resource_id', False),
            ('text', 'details', False), ('text', 'ip_address', False), ('datetime', 'created_at', True),
        ],
        'indexes': [('audit_actor_key', 'key', ['actor_id']), ('audit_created_key', 'key', ['created_at'])],
    },
    'medical_reports': {
        'columns': [
            ('text', 'patient_id', True), ('text', 'doctor_id', False), ('text', 'uploaded_by', True),
            ('text', 'file_id', True), ('text', 'file_name', True), ('text', 'file_type', True),
            ('text', 'report_type', False), ('text', 'description', False), ('datetime', 'report_date', False),
            ('datetime', 'created_at', True),
        ],
        'indexes': [('reports_patient_key', 'key', ['patient_id']), ('reports_file_key', 'key', ['file_id'])],
    },
    'pharmacy_records': {
        'columns': [
            ('text', 'patient_id', True), ('text', 'prescription_id', False), ('text', 'medicine_name', True),
            ('integer', 'quantity', False), ('text', 'status', True), ('text', 'prescribed_by', False),
            ('datetime', 'created_at', True), ('datetime', 'updated_at', True),
        ],
        'indexes': [('pharmacy_patient_key', 'key', ['patient_id']), ('pharmacy_status_key', 'key', ['status'])],
    },
    'insurance_records': {
        'columns': [
            ('text', 'patient_id', True), ('text', 'provider_name', True), ('text', 'policy_number', False),
            ('text', 'plan_name', False), ('text', 'coverage_details', False), ('text', 'status', True),
            ('datetime', 'valid_from', False), ('datetime', 'valid_until', False),
            ('datetime', 'created_at', True), ('datetime', 'updated_at', True),
        ],
        'indexes': [('insurance_patient_key', 'key', ['patient_id']), ('insurance_status_key', 'key', ['status'])],
    },
}


def _dict(value):
    if isinstance(value, dict):
        data = dict(value)
    elif hasattr(value, 'model_dump'):
        data = value.model_dump(by_alias=True)
    else:
        data = {}
    if isinstance(data.get('data'), dict):
        data.update(data['data'])
    return data


def _create_column(tables, database_id, table_id, kind, key, required):
    method = getattr(tables, f'create_{kind}_column')
    kwargs = {'database_id': database_id, 'table_id': table_id, 'key': key, 'required': required}
    if kind == 'string':
        kwargs['size'] = 255
    return method(**kwargs)


def _create_indexes(tables, database_id, table_id, indexes, existing, column_types, report, table_name):
    from appwrite.enums.tables_db_index_type import TablesDBIndexType
    index_types = {'key': TablesDBIndexType.KEY, 'unique': TablesDBIndexType.UNIQUE}
    for key, kind, columns in indexes:
        if key in existing:
            report['already_existing'].append(f'index:{table_name}.{key}')
            continue
        if all(column_types.get(column) in {'text', 'string'} for column in columns):
            tables.create_index(database_id, table_id, key, index_types[kind], columns, lengths=[191] * len(columns))
        else:
            tables.create_index(database_id, table_id, key, index_types[kind], columns)
        report['indexes_created'].append(f'{table_name}.{key}')


def provision_schema(app):
    tables = app.extensions.get('appwrite_tables_db')
    database_id = app.extensions.get('appwrite_database_id')
    if not tables or not database_id:
        raise RuntimeError('Appwrite TablesDB is not initialized')

    existing_tables = {
        item.get('$id'): item for item in _dict(tables.list_tables(database_id, total=False)).get('tables', [])
    }
    existing_by_name = {item.get('name'): item for item in existing_tables.values()}
    report = {'database_id': database_id, 'tables_found': sorted(existing_by_name), 'tables_created': [], 'columns_created': [], 'indexes_created': [], 'already_existing': [], 'failed': []}

    for name, spec in DOMAIN_TABLES.items():
        try:
            table = existing_by_name.get(name)
            if not table:
                table = _dict(tables.create_table(database_id, name, name, row_security=True, enabled=True))
                report['tables_created'].append(name)
            else:
                report['already_existing'].append(f'table:{name}')
            table_id = table.get('$id') or name
            table_data = _dict(tables.get_table(database_id, table_id))
            column_records = [_dict(column) for column in _dict(tables.list_columns(database_id, table_id, total=False)).get('columns', [])]
            columns = {column.get('key') for column in column_records}
            column_types = {column.get('key'): column.get('type') for column in column_records}
            for kind, key, required in spec['columns']:
                if key in columns:
                    report['already_existing'].append(f'column:{name}.{key}')
                    continue
                _create_column(tables, database_id, table_id, kind, key, required)
                report['columns_created'].append(f'{name}.{key}')
            existing_indexes = {_dict(index).get('key') for index in table_data.get('indexes', [])}
            _create_indexes(tables, database_id, table_id, spec.get('indexes', []), existing_indexes, column_types, report, name)
        except Exception as exc:
            report['failed'].append({'table': name, 'error': type(exc).__name__, 'message': str(exc)})
    report['ok'] = not report['failed']
    report['completed_at'] = datetime.utcnow().isoformat() + 'Z'
    return report