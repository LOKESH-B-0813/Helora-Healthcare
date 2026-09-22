"""Endpoint-level security tests for Medi-AI (Phase 24).

Covers conversation-id tampering, tool role gating at the HTTP layer, guest
restrictions (private data/tools are never reachable anonymously), and safe,
non-leaking error surfaces.
"""


def _patient(uid, role='patient'):
    return {
        'uid': uid, 'email': f'{uid}@helora.test', 'full_name': f'User {uid}',
        'role': role, 'protected': False, 'is_owner': False,
        'status': 'active', 'permissions': [],
    }


def _chat(client, message, language='en', conversation_id=None, stream=False, tools=None):
    return client.post('/api/medi-ai/chat', json={
        'message': message,
        'language': language,
        'conversation_id': conversation_id,
        'stream': stream,
        'tools': tools or [],
    })


def test_chat_with_foreign_conversation_id_rejected(client, harness):
    harness.user = _patient('alice')
    conv_id = client.post(
        '/api/medi-ai/conversations', json={'language': 'en'},
    ).get_json()['conversation']['id']

    harness.user = _patient('mallory')
    resp = _chat(client, 'hello', conversation_id=conv_id)
    assert resp.status_code == 404
    assert resp.get_json()['error']['code'] == 'conversation_not_found'


def test_tools_execute_role_gated_at_endpoint(client, harness):
    harness.user = _patient('doc-1', role='doctor')
    resp = client.post('/api/medi-ai/tools/execute', json={
        'tool': 'get_current_medications',
    })
    assert resp.status_code == 403
    assert resp.get_json()['error']['code'] == 'tool_forbidden'


def test_guest_cannot_execute_tools(client, harness):
    harness.user = None
    resp = client.post('/api/medi-ai/tools/execute', json={
        'tool': 'search_helora_doctors',
    })
    assert resp.status_code == 401


def test_unknown_tool_returns_safe_error(client, harness):
    harness.user = _patient('alice')
    resp = client.post('/api/medi-ai/tools/execute', json={
        'tool': 'explode_private_data',
    })
    body = resp.get_json(silent=True) or {}
    assert body.get('ok') is False
    assert body.get('error', {}).get('code') == 'unknown_tool'
    assert 'Traceback' not in resp.get_data(as_text=True)


def test_tool_error_does_not_leak_traceback(client, harness, monkeypatch):
    from app.medi_ai.errors import AppwriteUnavailableError

    def boom(*args, **kwargs):
        raise AppwriteUnavailableError()

    harness.user = _patient('alice')
    monkeypatch.setattr(
        'app.medi_ai.tools.backend_tools._require_appwrite', boom,
    )
    resp = client.post('/api/medi-ai/tools/execute', json={
        'tool': 'search_helora_doctors',
    })
    assert resp.status_code == 503
    raw = resp.get_data(as_text=True)
    assert 'Traceback' not in raw
    assert 'AppwriteUnavailableError' not in raw


def test_tools_catalogue_is_public_and_secret_free(client, harness):
    harness.user = None
    resp = client.get('/api/medi-ai/tools')
    assert resp.status_code == 200
    body = resp.get_json()
    assert body.get('ok') is True
    raw = str(body).lower()
    assert 'api_key' not in raw
    assert 'apikey' not in raw
    assert 'credential' not in raw


def test_anonymous_chat_ignores_requested_tools(client, harness):
    # A guest may *request* patient tools, but the pipeline must never invoke
    # them: no Appwrite access, no private data, no error.
    harness.user = None
    resp = _chat(
        client,
        'What should I know about hypertension?',
        tools=['get_recent_medical_reports', 'search_helora_doctors'],
    )
    data = resp.get_json(silent=True) or {}
    assert resp.status_code == 200
    assert data.get('anonymous') is True
    assert data.get('persisted') is False


def test_guest_chat_with_foreign_conversation_id_is_ignored(client, harness):
    # Anonymous traffic must never be tied to an existing conversation.
    harness.user = None
    resp = _chat(client, 'hello', conversation_id=999)
    assert resp.status_code == 200
    assert resp.get_json()['anonymous'] is True


def test_message_size_and_language_limits_enforced(client, harness):
    harness.user = _patient('alice')
    oversized = _chat(client, 'A' * 5000)
    assert oversized.status_code == 400
    assert oversized.get_json()['error']['code'] == 'message_too_large'

    bad_lang = _chat(client, 'hello', language='xx')
    assert bad_lang.status_code == 400
    assert bad_lang.get_json()['error']['code'] == 'invalid_language'


def test_sse_emergency_never_streams_generated_text(client, harness):
    harness.user = None
    resp = client.post('/api/medi-ai/chat', json={
        'message': "I can't breathe, chest pain and sweating!",
        'language': 'en',
        'stream': True,
    })
    assert resp.status_code == 200
    raw = resp.get_data(as_text=True)
    assert 'data: {"type":"start"}' in raw
    assert '"type": "delta"' not in raw
    assert '"type": "done"' in raw
    assert '"urgency": "emergency"' in raw


def test_stream_invalid_language_rejected_before_stream(client, harness):
    harness.user = None
    resp = client.post('/api/medi-ai/chat', json={
        'message': 'hello',
        'language': 'xx',
        'stream': True,
    })
    # Language validation happens before the streaming branch is entered.
    assert resp.status_code == 400
    assert resp.get_json()['error']['code'] == 'invalid_language'