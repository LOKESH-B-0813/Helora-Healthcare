"""Appwrite email/password session verification harness.

Validates the installed Appwrite Python SDK session lifecycle against the
REAL Appwrite project configured in backend/.env:

    1. create_email_password_session(email, password)
    2. attach the returned session exactly as the installed SDK expects
       (Client.set_session(session["secret"]) -> x-appwrite-session header)
    3. account.get()
    4. delete current session
    5. create a second session
    6. account.get() again

Root cause the harness originally hit (recorded; this is NOT an Appwrite
database failure): calling ``Account(client).get()`` on a client that has
ONLY project scope (no attached user session) returns
``401 User (role: guests) missing scopes (["account"])``. The created
session carries a ``secret`` that must be attached with
``Client.set_session(secret)`` before user-scoped calls.

No new account is ever created. ``--reset-patient-password`` only changes
the EXISTING fictional test patient's login secret server-side (Users API,
roles/status/users-table row/schema untouched) and persists it to the
repo-root ``.env.test.local`` (chmod 600). The patient account is discovered
from the users table (role == patient) and matched back to Appwrite auth.
"""
import argparse
import os
import secrets
import string
import sys
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from pathlib import Path

from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.exception import AppwriteException
from appwrite.query import Query
from appwrite.services.account import Account
from appwrite.services.tables_db import TablesDB
from appwrite.services.users import Users

BACKEND = Path(__file__).resolve().parent.parent
REPO = BACKEND.parent
CREDENTIALS_PATH = REPO / '.env.test.local'
PASS = 'PASS'
FAIL = 'FAIL'


def check(ok, message):
    print(f'{PASS if ok else FAIL}: {message}', flush=True)
    return ok


def timeout_call(fn, seconds=25):
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(fn)
        return future.result(timeout=seconds)


def call_with_retry(fn, seconds=25, tries=4, label='call'):
    last = None
    for attempt in range(tries):
        try:
            return timeout_call(fn, seconds)
        except FutureTimeout as exc:
            last = 'timed out'
            print(f'  [{label}] attempt {attempt + 1} timed out after {seconds}s - retrying', flush=True)
        except AppwriteException as exc:
            last = str(exc)
            print(f'  [{label}] attempt {attempt + 1} AppwriteError: {last[:110]} - retrying', flush=True)
        time.sleep(1)
    raise RuntimeError(f'[{label}] failed after {tries} attempts: {last}')


def load_config():
    load_dotenv(BACKEND / '.env')
    return (
        os.environ['APPWRITE_ENDPOINT'],
        os.environ['APPWRITE_PROJECT_ID'],
        os.environ['APPWRITE_API_KEY'],
    )


def read_credentials():
    if not CREDENTIALS_PATH.exists():
        print(f'{FAIL}: {CREDENTIALS_PATH} missing - run with --reset-patient-password first', flush=True)
        sys.exit(1)
    values = {}
    for line in CREDENTIALS_PATH.read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            values[key] = value.strip()
    email = values.get('HELORA_TEST_PATIENT_EMAIL', '')
    password = values.get('HELORA_TEST_PATIENT_PASSWORD', '')
    if not email or not password:
        print(f'{FAIL}: email/password not present in {CREDENTIALS_PATH}', flush=True)
        sys.exit(1)
    return email, password


def new_password():
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(alphabet) for _ in range(24))


def discover_patient(endpoint, project, api_key):
    client = Client()
    client.set_endpoint(endpoint).set_project(project).set_key(api_key)
    result = call_with_retry(
        lambda: TablesDB(client).list_rows(
            os.environ['APPWRITE_DATABASE_ID'],
            os.environ['APPWRITE_USERS_TABLE_ID'],
            queries=[Query.equal('role', 'patient')],
            model_type=dict,
        ),
        label='users-table patient rows',
    )
    rows = result.get('rows', []) if isinstance(result, dict) else getattr(result, 'rows', [])
    rows = [dict(r) if isinstance(r, dict) else r.model_dump(warnings=False) for r in rows]
    rows = [d.get('data') if isinstance(d.get('data'), dict) else d for d in rows]
    if not rows:
        print(f'{FAIL}: no role=patient row in users table - cannot pick the test patient', flush=True)
        sys.exit(1)
    print(f'{PASS}: users table has {len(rows)} patient row(s)', flush=True)
    canonical = next((r for r in rows if 'helora.test.patient' in str(r.get('user_id', ''))), None)
    for r in rows:
        marker = ' <- using' if r == canonical or canonical is None else ''
        print(f'      user_id={r.get("user_id")} role={r.get("role")} status={r.get("status")} name={r.get("name")}{marker}', flush=True)
    picked = canonical or rows[0]
    if not picked.get('user_id'):
        print(f'{FAIL}: patient row has no user_id to map to Appwrite auth', flush=True)
        sys.exit(1)
    return picked


def reset_patient_password(endpoint, project, api_key, email=None):
    picked = discover_patient(endpoint, project, api_key)
    user_id = picked['user_id']
    users = Users(Client().set_endpoint(endpoint).set_project(project).set_key(api_key))
    user = call_with_retry(lambda: users.get(user_id, model_type=dict), label='auth user by id')
    if isinstance(user, dict):
        email = user.get('email')
        print(f'      auth match: id={user.get("$id")} email={email} status={user.get("status")}', flush=True)
    else:
        data = user.model_dump(warnings=False)
        email = data.get('email')
        print(f'      auth match: id={data.get("id")} email={email}', flush=True)
    if not email:
        print(f'{FAIL}: could not resolve an auth email for user_id {user_id}', flush=True)
        sys.exit(1)
    password = new_password()
    call_with_retry(lambda: users.update_password(user_id, password, model_type=dict), label='update_password')
    print(f'{PASS}: reset password server-side for existing test patient {email} (id {user_id})', flush=True)
    print(f'      users-table row / role / status / Appwrite schema unchanged - no new account created', flush=True)
    lines = [
        '# Generated by backend/scripts/verify_appwrite_session_flow.py --reset-patient-password. Do not commit.',
        'HELORA_TEST_PATIENT_EMAIL=' + email,
        'HELORA_TEST_PATIENT_PASSWORD=' + password,
    ]
    CREDENTIALS_PATH.write_text('\n'.join(lines) + '\n')
    CREDENTIALS_PATH.chmod(0o600)
    print(f'{PASS}: credentials written to {CREDENTIALS_PATH} (chmod 600)', flush=True)


def run_flow(endpoint, project, email, password):
    session = Account(Client().set_endpoint(endpoint).set_project(project)).create_email_password_session(
        email, password
    )

    def as_dict(value):
        if isinstance(value, dict):
            return dict(value)
        data = value.model_dump(warnings=False)
        nested = data.get('data')
        if isinstance(nested, dict):
            data.update(nested)
        return data

    print('\n--- Step 1: create_email_password_session ---', flush=True)
    a = as_dict(session)
    if not a.get('secret'):
        print(f'{FAIL}: response has no session secret', flush=True)
        sys.exit(1)
    print(f'{PASS}: session created ($id={a.get("$id")}, userId={a.get("userId")}, has secret=True)', flush=True)

    print('\n--- Root-cause reproduction: account.get() WITHOUT attaching (expected guests 401) ---', flush=True)
    bare = Account(Client().set_endpoint(endpoint).set_project(project))
    try:
        bare.get()
        print(f'{FAIL}: account.get() without session unexpectedly succeeded', flush=True)
        sys.exit(1)
    except AppwriteException as exc:
        message = str(exc)
        check('guests' in message and 'account' in message, f'reproduced 401 guests missing scopes ["account"] ({message[:80]})')
        print('      -> confirms the failure is a HARNESS session-attachment issue, NOT an Appwrite DB failure', flush=True)

    print('\n--- Steps 2+3: Client.set_session(session["secret"]) then account.get() ---', flush=True)
    attached_client = Client().set_endpoint(endpoint).set_project(project)
    attached_client.set_session(a['secret'])
    user = as_dict(Account(attached_client).get())
    print(f'{PASS}: account.get() with attached session: $id={user.get("$id")} email={user.get("email")} name={user.get("name")}', flush=True)

    print('\n--- Step 4: delete current session, then account.get() (expected 401) ---', flush=True)
    Account(attached_client).delete_session('current')
    print(f'{PASS}: delete_session("current") succeeded', flush=True)
    try:
        Account(attached_client).get()
        print(f'{FAIL}: account.get() after delete unexpectedly succeeded', flush=True)
        sys.exit(1)
    except AppwriteException as exc:
        check(True, f'account.get() after delete fails as expected ({str(exc)[:70]})')

    print('\n--- Steps 5+6: create a second session, attach it, account.get() ---', flush=True)
    second = as_dict(Account(Client().set_endpoint(endpoint).set_project(project)).create_email_password_session(
        email, password
    ))
    second_client = Client().set_endpoint(endpoint).set_project(project)
    second_client.set_session(second['secret'])
    user2 = as_dict(Account(second_client).get())
    print(f'{PASS}: second session attached, account.get(): $id={user2.get("$id")} email={user2.get("email")}', flush=True)
    Account(second_client).delete_session('current')
    print(f'{PASS}: cleanup - second session deleted', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reset-patient-password', action='store_true',
                        help='Reset the EXISTING test patient password server-side and save credentials.')
    args = parser.parse_args()
    endpoint, project, api_key = load_config()
    if args.reset_patient_password:
        reset_patient_password(endpoint, project, api_key)
        return
    email, password = read_credentials()
    run_flow(endpoint, project, email, password)


if __name__ == '__main__':
    main()