"""Shared fixtures for Medi-AI tests.

Important: environment variables must be set BEFORE any ``app`` import so that
the SQLAlchemy engine uses a throwaway SQLite file and the provider stays
offline (dummy) for tests.
"""
import os
import sys

# Ensure ``from app import ...`` resolves to backend/ regardless of cwd.
BACKEND = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, os.path.abspath(BACKEND))

TEST_DB = '/tmp/opencode/test_medi_ai.db'
try:
    os.remove(TEST_DB)
except OSError:
    pass

os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + TEST_DB
os.environ['MEDI_AI_PROVIDER'] = 'dummy'
os.environ['MEDI_AI_RATE_AUTH_PER_HOUR'] = '60'
os.environ['MEDI_AI_RATE_ANON_PER_HOUR'] = '10'

import pytest
from flask import g, jsonify

from app import auth as auth_module
from app import create_app
from app.database import SessionLocal
from app.models import AIUsageLog, Conversation, Message


class AuthHarness:
    """Lets tests control ``g.user`` per request (replaces Appwrite JWT)."""

    def __init__(self):
        self.user = None
        self.block = False  # simulate a rejected token (401)

    def require_auth(self, role=None, optional=False):
        def decorator(function):
            from functools import wraps

            @wraps(function)
            def wrapper(*args, **kwargs):
                if self.block:
                    return jsonify({'error': 'Invalid or expired Appwrite session'}), 401
                if self.user is None:
                    if optional:
                        g.user = None
                        return function(*args, **kwargs)
                    return jsonify({'error': 'Missing Authorization token'}), 401
                g.user = self.user
                return function(*args, **kwargs)

            return wrapper

        return decorator


def user(uid, role='patient'):
    return {
        'uid': uid,
        'email': f'{uid}@helora.test',
        'full_name': f'User {uid}',
        'role': role,
        'protected': role in ('super_admin',),
        'is_owner': role == 'super_admin',
        'status': 'active',
        'permissions': [],
    }


@pytest.fixture(scope='session', autouse=True)
def _patch_auth():
    harness = AuthHarness()
    auth_module.require_auth = harness.require_auth
    # Route modules bind `require_auth` at import time inside create_app();
    # since we patched the source module and create the app lazily below, the
    # freshly imported route modules pick up the patched callable.
    yield harness


@pytest.fixture(scope='session')
def app(_patch_auth):
    application = create_app()
    yield application


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def _clean_db(app):
    yield
    db = SessionLocal()
    try:
        db.query(Message).delete()
        db.query(Conversation).delete()
        db.query(AIUsageLog).delete()
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def harness(_patch_auth):
    """Reset the auth harness for each test."""
    _patch_auth.block = False
    _patch_auth.user = user('alice', role='patient')
    return _patch_auth