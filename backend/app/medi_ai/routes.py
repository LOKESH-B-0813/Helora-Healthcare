"""Medi-AI HTTP API.

Endpoints:
    GET    /api/medi-ai/config          public overview (no secrets)
    GET    /api/medi-ai/languages       supported languages
    POST   /api/medi-ai/chat            optional-auth chat (SSE when stream=true)
    GET    /api/medi-ai/conversations   authenticated conversation history
    POST   /api/medi-ai/conversations   authenticated new conversation
    GET    /api/medi-ai/conversations/<id>   ownership-protected read
    PATCH  /api/medi-ai/conversations/<id>   rename
    DELETE /api/medi-ai/conversations/<id>   delete
    POST   /api/medi-ai/conversations/<id>/clear  clear messages
    GET    /api/medi-ai/tools           tool catalogue
    POST   /api/medi-ai/tools/execute   controlled tool execution (auth only)
    POST   /api/medi-ai/media           future image/document analysis (stub)
"""
import json
import logging
from typing import Optional

from flask import Blueprint, Response, current_app, g, jsonify, request, stream_with_context

from ..auth import require_auth
from .config import MediAIConfig
from .conversations.service import ConversationService
from .errors import (
    ConversationNotFoundError,
    InvalidLanguageError,
    MediAIError,
    RateLimitedError,
    error_response,
)
from .language_utils import resolve_language
from .observability import log_event, new_request_id
from .ratelimit import check_rate_limit
from .services.orchestrator import MediAIService
from .services.pipeline import ChatRequest

logger = logging.getLogger(__name__)

medi_ai_bp = Blueprint('medi_ai_bp', __name__)

_service: Optional[MediAIService] = None


def _get_service() -> MediAIService:
    global _service
    if _service is None:
        cfg = MediAIConfig(current_app)
        _service = MediAIService(
            config=cfg,
            conversations=ConversationService(),
        )
    return _service


def _current_user() -> Optional[dict]:
    return getattr(g, 'user', None)


def _client_ip() -> str:
    return request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown').split(',')[0].strip()


def _ratelimit_key(user: Optional[dict]) -> str:
    if user:
        return f"user:{user['uid']}"
    return f"ip:{_client_ip()}"


def _ratelimit_config():
    cfg = current_app.config.get('MEDI_AI_CONFIG')
    if cfg is None:
        cfg = MediAIConfig(current_app)
        current_app.config['MEDI_AI_CONFIG'] = cfg
    return cfg


def _handle_error(exc) -> tuple:
    if isinstance(exc, MediAIError):
        payload, status = error_response(exc)
        return jsonify(payload), status
    logger.exception('Unhandled Medi-AI error')
    from .errors import SafetyEngineFailureError
    payload, status = error_response(SafetyEngineFailureError())
    return jsonify(payload), status


@medi_ai_bp.route('/config', methods=['GET'])
def config():
    cfg = _ratelimit_config()
    return jsonify({'ok': True, 'config': cfg.public_overview()})


@medi_ai_bp.route('/languages', methods=['GET'])
def languages():
    cfg = _ratelimit_config()
    return jsonify({'ok': True, 'languages': cfg.supported_languages})


@medi_ai_bp.route('/chat', methods=['POST'])
@require_auth(optional=True)
def chat():
    request_id = new_request_id()
    started = __import__('time').monotonic()
    cfg = _ratelimit_config()
    user = _current_user()
    limit = cfg.rate_limit_auth_per_hour if user else cfg.rate_limit_anon_per_hour
    try:
        check_rate_limit('medi_ai', _ratelimit_key(user), limit, cfg.rate_limit_window_seconds)
    except RateLimitedError as exc:
        log_event(request_id, user_id=(user or {}).get('uid') or 'anon', endpoint='medi-ai/chat',
                  http_status=429, error_type=exc.code, rate_limited=True)
        return _handle_error(exc)

    body = request.get_json(silent=True) or {}
    message = str(body.get('message', ''))
    supported = _ratelimit_config().supported_languages
    language = resolve_language(str(body.get('language', '')), message, supported)
    if language is None:
        return _handle_error(InvalidLanguageError())
    conversation_id = body.get('conversation_id')
    try:
        conversation_id = int(conversation_id) if conversation_id else None
    except (TypeError, ValueError):
        conversation_id = None
    use_patient_data = _as_bool(body.get('use_patient_data'))
    tools = body.get('tools') or []
    if not isinstance(tools, list):
        tools = []
    stream = _as_bool(body.get('stream'))

    chat_request = ChatRequest(
        message=message,
        conversation_id=conversation_id,
        language=language,
        use_patient_data=use_patient_data,
        tools=[str(t) for t in tools],
        stream=stream,
    )

    if stream:
        def generate():
            yield 'event: start\ndata: {"type":"start"}\n\n'
            try:
                service = _get_service()
                has_done = False
                for event in service.stream(chat_request, user, _client_ip()):
                    if hasattr(event.data, 'model_dump'):
                        data = event.data.model_dump(mode='json')
                    else:
                        data = event.data
                    payload = json.dumps({'type': event.type, 'data': data})
                    yield f'event: {event.type}\ndata: {payload}\n\n'
                    if event.type == 'done':
                        has_done = True
                if not has_done:
                    payload = json.dumps({'type': 'error', 'data': {'code': 'pipeline_incomplete'}})
                    yield f'event: error\ndata: {payload}\n\n'
                log_event(request_id, user_id=(user or {}).get('uid') or 'anon', endpoint='medi-ai/chat',
                          http_status=200, latency_ms=int((__import__('time').monotonic() - started) * 1000),
                          streamed=True)
            except MediAIError as exc:
                yield f'event: error\ndata: {json.dumps({"type": "error", "data": exc.to_payload()["error"]})}\n\n'
            except Exception:
                logger.exception('Medi-AI SSE stream crashed [%s]', request_id)
                safe = '{"code":"internal_error","message":"Something went wrong. Please try again."}'
                yield f'event: error\ndata: {json.dumps({"type": "error", "data": json.loads(safe)})}\n\n'

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
            },
        )

    try:
        result = _get_service().chat(chat_request, user, _client_ip())
        response_payload = {
            'ok': True,
            'conversation_id': result.conversation_id,
            'anonymous': result.anonymous,
            'persisted': result.persisted,
            'structured': result.structured.model_dump(mode='json'),
            'provider': result.provider_name,
            'specialist_reason': result.specialist_reason,
        }
        log_event(request_id, user_id=(user or {}).get('uid') or 'anon', endpoint='medi-ai/chat',
                  http_status=200, latency_ms=int((__import__('time').monotonic() - started) * 1000),
                  safety=result.structured.urgency, streamed=False)
        return jsonify(response_payload)
    except MediAIError as exc:
        log_event(request_id, user_id=(user or {}).get('uid') or 'anon', endpoint='medi-ai/chat',
                  http_status=exc.http_status, error_type=exc.code)
        return _handle_error(exc)
    except Exception:
        logger.exception('Medi-AI chat route error [%s]', request_id)
        from .errors import SafetyEngineFailureError
        return _handle_error(SafetyEngineFailureError())


@medi_ai_bp.route('/conversations', methods=['GET'])
@require_auth()
def list_conversations():
    user = _current_user()
    try:
        conversations = _get_service().conversations.list_active(user['uid'])
        return jsonify({
            'ok': True,
            'conversations': [
                ConversationService.as_dict(conv) for conv in conversations
            ],
        })
    except Exception as exc:
        return _handle_error(exc)


@medi_ai_bp.route('/conversations', methods=['POST'])
@require_auth()
def create_conversation():
    user = _current_user()
    body = request.get_json(silent=True) or {}
    language = str(body.get('language', 'en'))
    if language not in _ratelimit_config().supported_languages:
        language = 'en'
    conv = _get_service().conversations.create(
        user['uid'], title=str(body.get('title', '')).strip(), language=language,
    )
    return jsonify({'ok': True, 'conversation': ConversationService.as_dict(conv)}), 201


@medi_ai_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@require_auth()
def get_conversation(conversation_id):
    user = _current_user()
    conv = _get_service().conversations.get(user['uid'], conversation_id)
    if not conv:
        return _handle_error(ConversationNotFoundError())
    payload = ConversationService.as_dict(conv)
    payload['messages'] = [
        ConversationService.message_to_dict(message) for message in conv.messages
    ]
    return jsonify({'ok': True, 'conversation': payload})


@medi_ai_bp.route('/conversations/<int:conversation_id>', methods=['PATCH'])
@require_auth()
def rename_conversation(conversation_id):
    user = _current_user()
    body = request.get_json(silent=True) or {}
    title = str(body.get('title', '')).strip()
    if not title:
        return jsonify({'ok': False, 'error': {'code': 'invalid_input', 'message': 'Title is required'}}), 400
    conv = _get_service().conversations.rename(user['uid'], conversation_id, title)
    if not conv:
        return _handle_error(ConversationNotFoundError())
    return jsonify({'ok': True, 'conversation': ConversationService.as_dict(conv)})


@medi_ai_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@require_auth()
def delete_conversation(conversation_id):
    user = _current_user()
    deleted = _get_service().conversations.delete(user['uid'], conversation_id)
    if not deleted:
        return _handle_error(ConversationNotFoundError())
    return jsonify({'ok': True})


@medi_ai_bp.route('/conversations/<int:conversation_id>/archive', methods=['POST'])
@require_auth()
def archive_conversation(conversation_id):
    user = _current_user()
    archived = _get_service().conversations.archive(user['uid'], conversation_id)
    if not archived:
        return _handle_error(ConversationNotFoundError())
    return jsonify({'ok': True})


@medi_ai_bp.route('/conversations/<int:conversation_id>/clear', methods=['POST'])
@require_auth()
def clear_conversation(conversation_id):
    user = _current_user()
    cleared = _get_service().conversations.clear_messages(user['uid'], conversation_id)
    if not cleared:
        return _handle_error(ConversationNotFoundError())
    return jsonify({'ok': True})


@medi_ai_bp.route('/tools', methods=['GET'])
@require_auth(optional=True)
def tools_catalogue():
    from .tools.registry import create_default_registry
    registry = create_default_registry()
    return jsonify({'ok': True, 'tools': registry.list_tools()})


@medi_ai_bp.route('/tools/execute', methods=['POST'])
@require_auth()
def execute_tool():
    user = _current_user()
    body = request.get_json(silent=True) or {}
    name = str(body.get('tool', ''))
    params = body.get('params') or {}
    if not isinstance(params, dict):
        params = {}
    if not name:
        return jsonify({'ok': False, 'error': {'code': 'missing_tool', 'message': 'Tool name is required'}}), 400

    from .tools.base import ToolContext
    from .tools.registry import create_default_registry
    registry = create_default_registry()
    try:
        result = registry.execute(name, params, ToolContext(user=user, language=str(body.get('language', 'en'))))
    except MediAIError as exc:
        return _handle_error(exc)

    if not result.success:
        return jsonify({
            'ok': False,
            'error': {'code': result.error_code, 'message': result.error_message},
            'available': result.available,
        }), 403 if result.error_code in ('tool_forbidden', 'forbidden') else 200

    return jsonify({'ok': True, 'data': result.data, 'available': result.available})


@medi_ai_bp.route('/media', methods=['POST'])
@require_auth()
def media_stub():
    """Future image/document analysis endpoint (safe stub)."""
    return jsonify({
        'ok': False,
        'error': {
            'code': 'not_implemented',
            'message': 'Image and document analysis is not available yet. '
                       'Uploaded medical files are handled by Helora health records.',
        },
    }), 501


def _as_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ('1', 'true', 'yes', 'on')
    return False


