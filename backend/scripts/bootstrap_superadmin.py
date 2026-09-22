"""Bootstrap or protect the Super Admin account.

Usage:
  Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables, or the script will prompt for the password.
  Ensure FIREBASE_* service account env vars are set (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).

This script uses the Firebase Admin SDK to create the user if missing, sets a protected flag in Firestore, and assigns custom claims.
"""
import os
import getpass
import logging

from dotenv import load_dotenv
load_dotenv()

import firebase_admin
from firebase_admin import credentials, auth, firestore


def init_firebase_from_env():
    project_id = os.environ.get('FIREBASE_PROJECT_ID')
    client_email = os.environ.get('FIREBASE_CLIENT_EMAIL')
    private_key = os.environ.get('FIREBASE_PRIVATE_KEY')
    storage_bucket = os.environ.get('FIREBASE_STORAGE_BUCKET')

    if not project_id or not client_email or not private_key:
        raise RuntimeError('Firebase service account not configured in environment variables.')

    private_key = private_key.replace('\\n', '\n')
    cred_dict = {
        'type': 'service_account',
        'project_id': project_id,
        'client_email': client_email,
        'private_key': private_key,
    }
    cred = credentials.Certificate(cred_dict)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {'projectId': project_id})


def main():
    email = os.environ.get('SUPERADMIN_EMAIL', 'lokesh16215@gmail.com')
    password = os.environ.get('SUPERADMIN_PASSWORD')
    if not password:
        # Prompt securely
        password = getpass.getpass(f'Password for Super Admin {email}: ')

    init_firebase_from_env()

    try:
        user = auth.get_user_by_email(email)
        print(f'Found existing user {email} (uid={user.uid})')
        uid = user.uid
    except auth.UserNotFoundError:
        print(f'Creating new user {email}')
        user = auth.create_user(email=email, password=password, email_verified=True)
        uid = user.uid

    # Set protected custom claims and role
    try:
        auth.set_custom_user_claims(uid, {'role': 'SUPER_ADMIN', 'protected': True})
    except Exception:
        logging.exception('Failed to set custom claims')

    # Ensure Firestore user doc exists with protected flag
    fs = firestore.client()
    doc_ref = fs.collection('users').document(uid)
    doc_ref.set({'email': email, 'role': 'SUPER_ADMIN', 'protected': True}, merge=True)

    print('Super Admin bootstrap complete.')


if __name__ == '__main__':
    main()
