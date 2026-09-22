"""Legacy Medi-AI chat routes.

Kept for backwards compatibility with the older chat UI. All conversation
operations now delegate to the modular Medi-AI subsystem, which enforces
conversation ownership (user_id == authenticated uid) and never leaks raw
provider exceptions. New functionality lives under /api/medi-ai/*.
"""
import logging

from flask import Blueprint, jsonify, request, g

from .auth import require_auth
from .medi_ai.conversations.service import ConversationService
from .medi_ai.errors import ConversationNotFoundError, MediAIError, error_response
from .medi_ai.services.orchestrator import MediAIService
from .medi_ai.services.pipeline import ChatRequest

chat_bp = Blueprint('chat_bp', __name__)
logger = logging.getLogger(__name__)

_service = None


def _get_service():
    global _service
    if _service is None:
        _service = MediAIService(
            conversations=ConversationService(),
        )
    return _service


def _json_error(exc):
    payload, status = error_response(exc)
    return jsonify(payload), status


@chat_bp.route('/chat/health', methods=['GET'])
def health():
    return jsonify({'ok': True})


@chat_bp.route('/chat/languages', methods=['GET'])
def languages():
    from .medi_ai.routes import _ratelimit_config
    cfg = _ratelimit_config()
    return jsonify({'ok': True, 'languages': cfg.supported_languages})


@chat_bp.route('/chat/conversations', methods=['POST'])
@require_auth()
def create_conversation():
    body = request.get_json(force=True) or {}
    title = body.get('title')
    language = body.get('language')
    conv = _get_service().conversations.create(
        user_id=g.user.get('uid'),
        title=title,
        language=language,
    )
    return jsonify({'ok': True, 'conversation_id': conv.id})


@chat_bp.route('/chat/conversations/<int:conv_id>/messages', methods=['POST'])
@require_auth()
def add_message(conv_id):
    body = request.get_json(force=True) or {}
    content = body.get('content')
    if not content:
        return jsonify({'error': 'Empty message'}), 400
    msg = _get_service().conversations.add_message(g.user.get('uid'), conv_id, 'user', str(content))
    if not msg:
        return _json_error(ConversationNotFoundError())
    return jsonify({'ok': True, 'message_id': msg.id})


@chat_bp.route('/chat/conversations/<int:conv_id>', methods=['GET'])
@require_auth()
def get_conversation(conv_id):
    conv = _get_service().conversations.get(g.user.get('uid'), conv_id)
    if not conv:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'ok': True, 'conversation': {
        'id': conv.id,
        'title': conv.title,
        'messages': [
            {'role': m.role, 'content': m.content, 'created_at': m.created_at.isoformat()}
            for m in conv.messages
        ],
    }})


@chat_bp.route('/chat', methods=['POST'])
@require_auth()
def chat():
    """Legacy single-endpoint chat. Delegates to the new pipeline."""
    body = request.get_json(force=True) or {}
    message = body.get('message')
    language = body.get('language', 'en')
    conv_id = body.get('conversation_id')

    if not message:
        return jsonify({'error': 'Empty message'}), 400
    if conv_id:
        try:
            conv_id = int(conv_id)
        except (TypeError, ValueError):
            conv_id = None

    try:
        result = _get_service().chat(
            ChatRequest(message=str(message), conversation_id=conv_id, language=str(language), tools=[], stream=False),
            g.user,
            request.remote_addr,
        )
    except MediAIError as exc:
        return _json_error(exc)

    return jsonify({
        'ok': True,
        'conversation_id': result.conversation_id,
        'assistant': {
            'id': result.assistant_message_id,
            'content': result.structured.message,
        },
    })


@chat_bp.route('/chat/analyze', methods=['POST'])
@require_auth()
def analyze():
    """Local, offline symptom analysis (no provider call)."""
    body = request.get_json(force=True) or {}
    text = body.get('text', '')
    if not text:
        return jsonify({'error': 'Empty text'}), 400

    lowered = text.lower()
    symptoms = []
    warnings = []
    severity = None

    keywords_emergency = [
        'severe chest pain', 'not breathing', 'difficulty breathing', 'unconscious',
        'passed out', 'severe bleeding', 'vomiting blood', 'suicidal', 'self harm',
    ]
    for k in keywords_emergency:
        if k in lowered:
            warnings.append(k)
            severity = 'severe'

    symptom_map = {
        'fever': 'fever', 'cough': 'cough', 'chest pain': 'chest pain', 'breath': 'breathlessness',
        'headache': 'headache', 'dizziness': 'dizziness', 'stomach': 'abdominal pain', 'vomit': 'vomiting',
    }
    for k, v in symptom_map.items():
        if k in lowered:
            symptoms.append(v)

    if severity is None:
        if any(w in lowered for w in ['severe', 'very bad', 'worst', 'terrible']):
            severity = 'severe'
        elif any(w in lowered for w in ['mild', 'light', 'slight']):
            severity = 'mild'

    follow_up_questions = []
    if 'chest pain' in symptoms or 'breathlessness' in symptoms:
        follow_up_questions.extend(["When did this start?", "Is the pain severe or crushing?", "Are you sweaty or faint?"])
    if 'fever' in symptoms:
        follow_up_questions.append('Do you have associated cough or body aches?')

    return jsonify({
        'ok': True,
        'analysis': {
            'understanding': f'I detected these symptoms: {symptoms}',
            'symptoms': symptoms,
            'duration': None,
            'severity': severity,
            'warnings': warnings,
            'follow_up_questions': follow_up_questions,
        },
    })


@chat_bp.route('/chat/recommend_doctor', methods=['POST'])
@require_auth()
def recommend_doctor():
    """Specialty suggestion based on symptoms plus a real doctor lookup.

    No email/phone fields are ever returned. Doctor data comes from the
    controlled Helora doctor_profiles lookup.
    """
    body = request.get_json(force=True) or {}
    symptoms = body.get('symptoms', [])
    if not isinstance(symptoms, list) or not symptoms:
        return jsonify({'error': 'Symptoms are required'}), 400

    from .medi_ai.specialist import map_specialty
    from .medi_ai.tools.base import ToolContext
    from .medi_ai.tools.registry import create_default_registry

    text = ' '.join(str(s) for s in symptoms)
    specialization_label = map_specialty(text)[0]

    registry = create_default_registry()
    result = registry.execute(
        'search_helora_doctors',
        {'specialty': specialization_label, 'limit': 8},
        ToolContext(user=g.user, language=str(body.get('language', 'en'))),
    )

    doctors = []
    if result.success:
        for row in result.data.get('doctors', []):
            doctors.append({
                'id': row.get('doctor_id'),
                'name': row.get('name'),
                'specialization': row.get('specialty'),
            })

    return jsonify({'ok': True, 'specialization': specialization_label, 'doctors': doctors})


@chat_bp.route('/chat/book_appointment', methods=['POST'])
@require_auth()
def book_appointment():
    """Legacy appointment booking via the controlled tool.

    Only accepts a validated doctor_id (rejects free-text doctor names).
    """
    body = request.get_json(force=True) or {}
    doctor_id = body.get('doctor_id')
    date = body.get('date')
    time = body.get('time')
    reason = body.get('reason')

    if not doctor_id or not date or not time:
        return jsonify({'error': 'doctor_id, date and time are required'}), 400

    from .medi_ai.tools.base import ToolContext
    from .medi_ai.tools.registry import create_default_registry

    registry = create_default_registry()
    result = registry.execute(
        'create_appointment_request',
        {'doctor_id': str(doctor_id), 'appointment_date': str(date), 'appointment_time': str(time), 'appointment_type': 'in-person', 'reason': reason or ''},
        ToolContext(user=g.user, language=str(body.get('language', 'en'))),
    )

    if result.success:
        return jsonify({'ok': True, 'appointment': result.data})
    return jsonify({'error': result.error_message or 'Failed to book appointment'}), 400