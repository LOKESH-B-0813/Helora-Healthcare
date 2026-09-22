"""Initialize the server-side Appwrite SDK.

This module only creates SDK clients and registers them on ``app.extensions``.
Feature routes are intentionally not migrated in this phase.
"""
import logging
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError

from appwrite.query import Query


def init_appwrite(app):
    """Attach configured Appwrite clients to the Flask application.

    Appwrite is optional during development so the existing Firebase-backed
    routes can continue to load while migration work is staged.
    """
    endpoint = app.config.get('APPWRITE_ENDPOINT')
    project_id = app.config.get('APPWRITE_PROJECT_ID')
    api_key = app.config.get('APPWRITE_API_KEY')

    if not project_id or not api_key:
        logging.warning('Appwrite not configured; APPWRITE_PROJECT_ID/API_KEY are missing.')
        return False

    try:
        from appwrite.client import Client
        from appwrite.services.account import Account
        from appwrite.services.databases import Databases
        from appwrite.services.tables_db import TablesDB
        from appwrite.services.storage import Storage
        from appwrite.services.users import Users

        client = Client()
        client.set_endpoint(endpoint)
        client.set_project(project_id)
        client.set_key(api_key)

        app.extensions['appwrite_client'] = client
        app.extensions['appwrite_account'] = Account(client)
        app.extensions['appwrite_users'] = Users(client)
        app.extensions['appwrite_databases'] = Databases(client)
        app.extensions['appwrite_tables_db'] = TablesDB(client)
        app.extensions['appwrite_storage'] = Storage(client)
        app.extensions['appwrite_database_id'] = app.config.get('APPWRITE_DATABASE_ID')
        app.extensions['appwrite_users_table_id'] = app.config.get('APPWRITE_USERS_TABLE_ID')
        app.extensions['appwrite_storage_bucket_id'] = app.config.get('APPWRITE_STORAGE_BUCKET_ID')
        app.extensions['appwrite_table_ids'] = {
            'users': app.config.get('APPWRITE_USERS_TABLE_ID', 'users'),
            'doctor_profiles': app.config.get('APPWRITE_DOCTOR_PROFILES_TABLE_ID', 'doctor_profiles'),
            'employees': app.config.get('APPWRITE_EMPLOYEES_TABLE_ID', 'employees'),
            'appointments': app.config.get('APPWRITE_APPOINTMENTS_TABLE_ID', 'appointments'),
            'notifications': app.config.get('APPWRITE_NOTIFICATIONS_TABLE_ID', 'notifications'),
            'audit_logs': app.config.get('APPWRITE_AUDIT_LOGS_TABLE_ID', 'audit_logs'),
            'medical_reports': app.config.get('APPWRITE_MEDICAL_REPORTS_TABLE_ID', 'medical_reports'),
            'pharmacy_records': app.config.get('APPWRITE_PHARMACY_RECORDS_TABLE_ID', 'pharmacy_records'),
            'insurance_records': app.config.get('APPWRITE_INSURANCE_RECORDS_TABLE_ID', 'insurance_records'),
            'consultation_records': app.config.get('APPWRITE_CONSULTATION_RECORDS_TABLE_ID', 'consultation_records'),
            'prescriptions': app.config.get('APPWRITE_PRESCRIPTIONS_TABLE_ID', 'prescriptions'),
            'prescription_items': app.config.get('APPWRITE_PRESCRIPTION_ITEMS_TABLE_ID', 'prescription_items'),
            'doctor_advice': app.config.get('APPWRITE_DOCTOR_ADVICE_TABLE_ID', 'doctor_advice'),
            'patient_profiles': app.config.get('APPWRITE_PATIENT_PROFILES_TABLE_ID', 'patient_profiles'),
        }
        logging.info('Appwrite SDK initialized for project %s.', project_id)
        return True
    except ImportError:
        logging.exception('Appwrite SDK is not installed. Install the appwrite package.')
    except Exception:
        logging.exception('Failed to initialize Appwrite SDK.')
    return False


def check_appwrite_resources(app):
    """Read the configured Appwrite resources without changing any data."""
    tables_db = app.extensions.get('appwrite_tables_db')
    storage = app.extensions.get('appwrite_storage')
    users = app.extensions.get('appwrite_users')
    database_id = app.extensions.get('appwrite_database_id')
    users_table_id = app.extensions.get('appwrite_users_table_id')
    bucket_id = app.extensions.get('appwrite_storage_bucket_id')

    if not all((tables_db, storage, users, database_id, users_table_id, bucket_id)):
        return {
            'ok': False,
            'error': 'Appwrite is not initialized or resource IDs are missing.',
        }

    checks = {}
    timeout_seconds = app.config.get('APPWRITE_HEALTH_TIMEOUT_SECONDS', 5)

    def resource_id(resource):
        if isinstance(resource, dict):
            return resource.get('$id')
        if hasattr(resource, 'model_dump'):
            return resource.model_dump(by_alias=True).get('$id')
        return getattr(resource, '$id', None)

    def read_resource(name, callback):
        try:
            resource = callback()
            checks[name] = {'ok': True, 'id': resource_id(resource)}
        except Exception as exc:
            logging.exception('Appwrite %s check failed.', name)
            checks[name] = {
                'ok': False,
                'error': type(exc).__name__,
                'status_code': getattr(exc, 'code', None),
            }

    callbacks = {
            'authentication': lambda: users.list(queries=[Query.limit(1)]),
        'database': lambda: tables_db.get(database_id),
        'users_table': lambda: tables_db.get_table(database_id, users_table_id),
        'storage_bucket': lambda: storage.get_bucket(bucket_id),
    }
    executor = ThreadPoolExecutor(max_workers=len(callbacks))
    futures = {name: executor.submit(read_resource, name, callback) for name, callback in callbacks.items()}
    deadline = time.monotonic() + timeout_seconds
    for name, future in futures.items():
        try:
            remaining = max(0, deadline - time.monotonic())
            future.result(timeout=remaining)
        except TimeoutError:
            checks[name] = {
                'ok': False,
                'error': 'timeout',
                'timeout_seconds': timeout_seconds,
            }
        except Exception as exc:
            checks[name] = {
                'ok': False,
                'error': type(exc).__name__,
                'status_code': getattr(exc, 'code', None),
            }
    executor.shutdown(wait=False, cancel_futures=True)
    return {'ok': all(item['ok'] for item in checks.values()), 'checks': checks}