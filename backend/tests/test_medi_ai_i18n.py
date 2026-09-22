"""i18n regression tests: UTF-8 streaming + bilingual (native + romanized) replies."""
import requests
from requests.structures import CaseInsensitiveDict
from requests.utils import get_encoding_from_headers

from app.medi_ai.conversations.service import ConversationService
from app.medi_ai.provider.gemini import GeminiProvider
from app.medi_ai.schemas.base import ChatTurn
from app.medi_ai.services.orchestrator import MediAIService
from app.medi_ai.services.pipeline import ChatRequest

TAMIL_TEXT = 'உங்களுக்கு தலைவலி ஏற்பட்டுள்ளது'


def _sse_response(text):
    """Fake Gemini SSE response with no charset header, exactly like the live
    `streamGenerateContent?alt=sse` endpoint (`Content-Type: text/event-stream`)."""
    event = (
        'data: {"candidates": [{"content": {"parts": [{"text": "%s"}]}}]}' % text
    ).encode('utf-8') + b'\n\n'
    resp = requests.Response()
    resp.status_code = 200
    resp.headers['Content-Type'] = 'text/event-stream'
    resp._content = event
    resp._content_consumed = True
    # Mirror requests/adapters.py `build_response`, which sets response.encoding
    # from the headers on every real HTTP response.
    resp.encoding = get_encoding_from_headers(resp.headers)
    return resp


def test_sse_without_charset_defaults_to_latin1():
    """Documents the root cause: on a real HTTP response, requests guesses
    ISO-8859-1 for `text/event-stream` bodies with no charset, so Tamil UTF-8
    bytes decode into `à®�...` mojibake unless the provider pins UTF-8."""
    headers = CaseInsensitiveDict({'Content-Type': 'text/event-stream'})
    assert get_encoding_from_headers(headers) == 'ISO-8859-1'
    assert _sse_response(TAMIL_TEXT).encoding == 'ISO-8859-1'


def test_stream_chat_decodes_tamil_utf8():
    provider = GeminiProvider(api_key='test-key')
    provider._session.post = lambda *args, **kwargs: _sse_response(TAMIL_TEXT)
    chunks = list(provider.stream_chat([ChatTurn(role='user', content='hi')], language='ta'))
    text = ''.join(chunks)
    assert TAMIL_TEXT in text
    assert 'à' not in text


EXPECTED_HEADINGS = {
    'ta': 'Tanglish:',
    'hi': 'Hinglish:',
    'te': 'Romanized Telugu:',
    'ml': 'Manglish:',
    'kn': 'Romanized Kannada:',
}


def test_bilingual_reply_instruction_for_each_language():
    service = MediAIService(conversations=ConversationService())
    for language, heading in EXPECTED_HEADINGS.items():
        turns = service._build_turns(
            ChatRequest(message='hello', language=language), None, None, [], '', '',
        )
        system = turns[0].content
        assert 'Bilingual reply format' in system, language
        assert 'native script first' in system, language
        assert heading in system, language


def test_english_has_no_dual_script_section():
    service = MediAIService(conversations=ConversationService())
    turns = service._build_turns(
        ChatRequest(message='hello', language='en'), None, None, [], '', '',
    )
    assert 'Bilingual reply format' not in turns[0].content
