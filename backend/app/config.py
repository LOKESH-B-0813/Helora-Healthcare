import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret')
    # Appwrite foundation settings. The API key is server-only.
    APPWRITE_ENDPOINT = os.environ.get('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1')
    APPWRITE_PROJECT_ID = os.environ.get('APPWRITE_PROJECT_ID')
    APPWRITE_API_KEY = os.environ.get('APPWRITE_API_KEY')
    APPWRITE_DATABASE_ID = os.environ.get('APPWRITE_DATABASE_ID', 'helora_healthcare')
    APPWRITE_USERS_TABLE_ID = os.environ.get('APPWRITE_USERS_TABLE_ID', 'users')
    APPWRITE_APPOINTMENTS_TABLE_ID = os.environ.get('APPWRITE_APPOINTMENTS_TABLE_ID', 'appointments')
    APPWRITE_DOCTOR_PROFILES_TABLE_ID = os.environ.get('APPWRITE_DOCTOR_PROFILES_TABLE_ID', 'doctor_profiles')
    APPWRITE_EMPLOYEES_TABLE_ID = os.environ.get('APPWRITE_EMPLOYEES_TABLE_ID', 'employees')
    APPWRITE_NOTIFICATIONS_TABLE_ID = os.environ.get('APPWRITE_NOTIFICATIONS_TABLE_ID', 'notifications')
    APPWRITE_AUDIT_LOGS_TABLE_ID = os.environ.get('APPWRITE_AUDIT_LOGS_TABLE_ID', 'audit_logs')
    APPWRITE_MEDICAL_REPORTS_TABLE_ID = os.environ.get('APPWRITE_MEDICAL_REPORTS_TABLE_ID', 'medical_reports')
    APPWRITE_PHARMACY_RECORDS_TABLE_ID = os.environ.get('APPWRITE_PHARMACY_RECORDS_TABLE_ID', 'pharmacy_records')
    APPWRITE_INSURANCE_RECORDS_TABLE_ID = os.environ.get('APPWRITE_INSURANCE_RECORDS_TABLE_ID', 'insurance_records')
    APPWRITE_CONSULTATION_RECORDS_TABLE_ID = os.environ.get('APPWRITE_CONSULTATION_RECORDS_TABLE_ID', 'consultation_records')
    APPWRITE_PRESCRIPTIONS_TABLE_ID = os.environ.get('APPWRITE_PRESCRIPTIONS_TABLE_ID', 'prescriptions')
    APPWRITE_PRESCRIPTION_ITEMS_TABLE_ID = os.environ.get('APPWRITE_PRESCRIPTION_ITEMS_TABLE_ID', 'prescription_items')
    APPWRITE_DOCTOR_ADVICE_TABLE_ID = os.environ.get('APPWRITE_DOCTOR_ADVICE_TABLE_ID', 'doctor_advice')
    APPWRITE_PATIENT_PROFILES_TABLE_ID = os.environ.get('APPWRITE_PATIENT_PROFILES_TABLE_ID', 'patient_profiles')
    APPWRITE_STORAGE_BUCKET_ID = os.environ.get('APPWRITE_STORAGE_BUCKET_ID', 'helora_healthcare_files')
    APPWRITE_HEALTH_TIMEOUT_SECONDS = float(os.environ.get('APPWRITE_HEALTH_TIMEOUT_SECONDS', '5'))
    APPWRITE_REQUEST_TIMEOUT_SECONDS = float(os.environ.get('APPWRITE_REQUEST_TIMEOUT_SECONDS', '8'))
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID')
    FIREBASE_CLIENT_EMAIL = os.environ.get('FIREBASE_CLIENT_EMAIL')
    FIREBASE_PRIVATE_KEY = os.environ.get('FIREBASE_PRIVATE_KEY')
    FIREBASE_STORAGE_BUCKET = os.environ.get('FIREBASE_STORAGE_BUCKET')
    FRONTEND_ORIGIN = os.environ.get('FRONTEND_ORIGIN', 'http://localhost:3000')
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
    TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # AI provider selection
    AI_PROVIDER = os.environ.get('AI_PROVIDER', 'openai')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    # Rate limiting
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '60 per minute')
