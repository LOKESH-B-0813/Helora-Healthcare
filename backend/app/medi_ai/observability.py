"""Safe, privacy-preserving observability for Medi-AI.

Only structured metadata is logged. Message content, health data, tokens,
passwords, and API keys are never written to logs.
"""
import logging
import threading
import time
import uuid

logger = logging.getLogger('medi_ai')

SAFE_FIELDS = (
    'request_id', 'user_id', 'endpoint', 'method', 'http_status',
    'latency_ms', 'provider', 'model', 'provider_status', 'provider_error_type',
    'error_type', 'safety', 'urgency', 'intent', 'topic',
    'message_char_count', 'message_token_estimate', 'language',
    'num_sources', 'num_follow_up_questions', 'tool', 'streamed',
    'db_status', 'conversation_id', 'rate_limited',
)

_SEQUENCE = 0
_LOCK = threading.Lock()


def new_request_id() -> str:
    global _SEQUENCE
    with _LOCK:
        _SEQUENCE = (_SEQUENCE + 1) % 100000
        return f"req-{int(time.time() * 1000)}-{_SEQUENCE}-{uuid.uuid4().hex[:6]}"


def _estimate_tokens(text: str) -> int:
    if not text:
        return 0
    # Rough heuristic: ~4 chars per token. Never an exact meter.
    return max(1, len(text) // 4)


def log_event(request_id: str, **fields) -> None:
    payload = {'request_id': request_id}
    for key, value in fields.items():
        if key in SAFE_FIELDS:
            payload[key] = value
    logger.info('medi_ai event', extra={'medi_ai_event': payload})


class RequestTimer:
    def __init__(self):
        self._start = time.monotonic()

    @property
    def elapsed_ms(self) -> int:
        return int((time.monotonic() - self._start) * 1000)