"""Endpoint-level API tests for Medi-AI."""
from app.medi_ai.errors import RateLimitedError


def _chat(client, message, language='en', conversation_id=None, stream=False):
    return client.post('/api/medi-ai/chat', json={
        'message': message,
        'language': language,
        'conversation_id': conversation_id,
        'stream': stream,
    })


def test_guest_chat_is_stateless(client, harness):
    harness.user = None
    resp = _chat(client, 'Hello Medi-AI')
    data = resp.get_json(silent=True) or {}
    assert resp.status_code == 200
    assert data.get('anonymous') is True
    assert data.get('persisted') is False
    structured = data.get('structured', {})
    assert structured.get('message')
    assert structured.get('urgency') in ('routine', 'soon', 'urgent', 'emergency')


def test_guest_cannot_read_conversations(client, harness):
    harness.user = None
    resp = client.get('/api/medi-ai/conversations')
    assert resp.status_code == 401


def test_conversation_flow_ownership(client, harness):
    harness.user = None
    resp = client.get('/api/medi-ai/conversations')
    assert resp.status_code == 401

    harness.user = {
        'uid': 'alice', 'email': 'a@h.test', 'full_name': 'Alice',
        'role': 'patient', 'protected': False, 'is_owner': False,
        'status': 'active', 'permissions': [],
    }
    create = client.post('/api/medi-ai/conversations', json={'language': 'en'})
    assert create.status_code == 201
    conv_id = create.get_json()['conversation']['id']

    listed = client.get('/api/medi-ai/conversations')
    assert listed.status_code == 200
    ids = [c['id'] for c in listed.get_json()['conversations']]
    assert conv_id in ids

    resp = client.get(f'/api/medi-ai/conversations/{conv_id}')
    assert resp.status_code == 200


def test_cross_user_conversation_inaccessible(client, harness):
    harness.user = {
        'uid': 'alice', 'email': 'a@h.test', 'full_name': 'Alice',
        'role': 'patient', 'protected': False, 'is_owner': False,
        'status': 'active', 'permissions': [],
    }
    conv_id = client.post('/api/medi-ai/conversations', json={'language': 'en'}).get_json()['conversation']['id']

    harness.user = {
        'uid': 'mallory', 'email': 'm@h.test', 'full_name': 'Mallory',
        'role': 'patient', 'protected': False, 'is_owner': False,
        'status': 'active', 'permissions': [],
    }
    assert client.get(f'/api/medi-ai/conversations/{conv_id}').status_code == 404
    assert client.patch(f'/api/medi-ai/conversations/{conv_id}', json={'title': 'hacked'}).status_code == 404
    assert client.delete(f'/api/medi-ai/conversations/{conv_id}').status_code == 404
    assert client.post(f'/api/medi-ai/conversations/{conv_id}/clear').status_code == 404


def test_empty_message_rejected(client):
    resp = _chat(client, '   ')
    assert resp.status_code == 400
    assert resp.get_json()['error']['code'] == 'empty_message'


def test_oversized_message_rejected(client):
    resp = _chat(client, 'A' * 5000)
    assert resp.status_code == 400
    assert resp.get_json()['error']['code'] == 'message_too_large'


def test_invalid_language_falls_back(client):
    resp = _chat(client, 'Hello', language='xx')
    assert resp.status_code == 400
    assert resp.get_json()['error']['code'] == 'invalid_language'


def test_provider_failure_is_safe(client, harness, monkeypatch):
    from app.medi_ai import services
    from app.medi_ai.errors import ProviderUnavailableError

    def boom(*args, **kwargs):
        raise ProviderUnavailableError()

    monkeypatch.setattr(services.orchestrator.MediAIService, '_call_structured', boom)
    resp = _chat(client, 'What is hypertension?')
    assert resp.status_code == 503
    body = resp.get_data(as_text=True)
    assert 'Traceback' not in body
    assert 'ProviderUnavailableError' not in body


def test_invalid_language_rejected_flow(client, harness, monkeypatch):
    """A provider invalid-key style failure must not leak the key."""
    from app.medi_ai.errors import ProviderInvalidKeyError

    def boom(*args, **kwargs):
        raise ProviderInvalidKeyError()

    monkeypatch.setattr(
        'app.medi_ai.services.orchestrator.MediAIService._call_structured', boom,
    )
    harness.user['uid'] = 'ratelimit-key-user'
    resp = _chat(client, 'Fever for 2 days')
    assert resp.status_code == 503
    body = resp.get_data(as_text=True)
    assert 'api_key' not in body
    assert 'AIza' not in body


def test_rate_limit_endpoint_429(client, harness, monkeypatch):
    cfg = {'limit': 2, 'calls': 0}

    def fake_check(scope, key, limit, window):
        cfg['calls'] += 1
        if cfg['calls'] > cfg['limit']:
            raise RateLimitedError()

    monkeypatch.setattr('app.medi_ai.routes.check_rate_limit', fake_check)
    harness.user['uid'] = 'rate-limit-endpoint-user'
    for _ in range(2):
        assert _chat(client, 'Hi').status_code == 200
    resp = _chat(client, 'Hi again')
    assert resp.status_code == 429
    assert resp.get_json()['error']['code'] == 'rate_limited'


def test_normal_chat_returns_structured(client):
    resp = _chat(client, 'I have a mild headache since morning')
    assert resp.status_code == 200
    data = resp.get_json()
    s = data['structured']
    assert s['message']
    assert s['urgency'] in ('routine', 'soon', 'urgent', 'emergency')
    assert isinstance(s['sources'], list)
    assert isinstance(s['actions'], list)
    assert 'follow_up_questions' in s


def test_normal_chat_includes_specialist_reason(client):
    resp = _chat(client, 'Which specialist should I see for a skin rash?')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'specialist_reason' in data
    assert isinstance(data['specialist_reason'], str)
    if data['structured'].get('recommended_specialty'):
        assert data['specialist_reason']  # non-empty reason accompanies a specialty


def test_multilingual_message_is_auto_detected(client):
    resp = _chat(client, 'எனக்கு மார்பு வலி மற்றும் மூச்சுத்திணறல் உள்ளது.', language='')
    assert resp.status_code == 200
    s = resp.get_json()['structured']
    assert s['urgency'] == 'emergency'
    assert 'seek_emergency_care_now' in s['actions']


def test_multilingual_message_explicit_language_wins(client):
    # Explicit language wins for text handling, but the safety engine still
    # matches the raw message script (Tamil text + explicit Hindi language).
    resp = _chat(client, 'எனக்கு மார்பு வலி மற்றும் மூச்சுத்திணறல் உள்ளது.', language='hi')
    assert resp.status_code == 200
    s = resp.get_json()['structured']
    assert s['urgency'] == 'emergency'
    assert 'seek_emergency_care_now' in s['actions']


def test_emergency_chat_endpoint(client):
    resp = _chat(client, "I can't breathe, chest pain and sweating!")
    assert resp.status_code == 200
    s = resp.get_json()['structured']
    assert s['urgency'] == 'emergency'
    assert 'seek_emergency_care_now' in s['actions']


def test_sse_stream_chat(client):
    resp = client.post('/api/medi-ai/chat', json={
        'message': 'Tell me about fever management',
        'language': 'en',
        'stream': True,
    })
    assert resp.status_code == 200
    assert resp.headers.get('Content-Type', '').startswith('text/event-stream')
    raw = resp.get_data(as_text=True)
    assert '"type": "start"' in raw
    assert '"type": "delta"' in raw
    assert '"type": "done"' in raw
    assert '"specialist_reason"' in raw


def test_media_stub_returns_501(client):
    resp = client.post('/api/medi-ai/media', json={'description': 'x-ray'})
    assert resp.status_code == 501
    assert resp.get_json()['error']['code'] == 'not_implemented'


def test_conversation_history_is_sent_to_provider(harness):
    from app.medi_ai.conversations.service import ConversationService
    from app.medi_ai.provider.dummy import DummyProvider
    from app.medi_ai.services.orchestrator import MediAIService
    from app.medi_ai.services.pipeline import ChatRequest

    class RecordingProvider(DummyProvider):
        name = 'recording'

        def __init__(self):
            self.seen = []

        def structured(self, turns, response_schema, **kwargs):
            self.seen.append([(t.role, t.content) for t in turns])
            return super().structured(turns, response_schema, **kwargs)

    provider = RecordingProvider()
    service = MediAIService(provider=provider, conversations=ConversationService())
    user = harness.user

    first = service.chat(ChatRequest(message='I have a headache', language='en'), user)
    service.chat(
        ChatRequest(
            message='It has lasted two days',
            language='en',
            conversation_id=first.conversation_id,
        ),
        user,
    )

    prompt = provider.seen[1]
    assert prompt[0][0] == 'system'
    assert ('user', 'I have a headache') in prompt
    assert any(role == 'assistant' for role, _ in prompt)
    assert prompt[-1] == ('user', 'It has lasted two days')


def test_history_not_loaded_for_other_users_conversation(harness):
    from app.medi_ai.conversations.service import ConversationService
    from app.medi_ai.services.orchestrator import MediAIService
    from app.medi_ai.errors import ConversationNotFoundError
    from app.medi_ai.services.pipeline import ChatRequest

    service = MediAIService(conversations=ConversationService())
    alice = harness.user
    conv = service.conversations.create(alice['uid'], language='en')
    other = dict(alice, uid='mallory')

    try:
        service.chat(
            ChatRequest(message='hello', language='en', conversation_id=conv.id),
            other,
        )
    except ConversationNotFoundError:
        pass
    else:  # pragma: no cover
        raise AssertionError('Cross-user history access was not blocked')