import logging
import firebase_admin
from firebase_admin import credentials, auth, storage, firestore

def init_firebase(app):
    cfg = app.config
    project_id = cfg.get('FIREBASE_PROJECT_ID')
    client_email = cfg.get('FIREBASE_CLIENT_EMAIL')
    private_key = cfg.get('FIREBASE_PRIVATE_KEY')
    storage_bucket = cfg.get('FIREBASE_STORAGE_BUCKET')

    if not project_id or not client_email or not private_key:
        logging.warning('Firebase service account not configured; Firebase Admin disabled.')
        return

    # Reconstruct private key newlines if they were escaped
    private_key = private_key.replace('\\n', '\n')

    cred_dict = {
        'type': 'service_account',
        'project_id': project_id,
        'client_email': client_email,
        'private_key': private_key,
    }

    try:
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {
            'projectId': project_id,
            'storageBucket': storage_bucket
        })
        # Attach firebase clients to app for easy import
        app.extensions = getattr(app, 'extensions', {})
        app.extensions['firebase_auth'] = auth
        app.extensions['firebase_storage'] = storage
        app.extensions['firebase_firestore'] = firestore.client()
        logging.info('Firebase Admin initialized.')
    except Exception as e:
        logging.exception('Failed to initialize Firebase Admin: %s', e)
