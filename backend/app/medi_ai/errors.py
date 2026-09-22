"""Safe error taxonomy for Medi-AI.

Every error carries a user-safe message. Internal exception details are never
serialized into API responses so provider errors and secrets cannot leak.
"""
from typing import Any, Dict, Optional


class MediAIError(Exception):
    code = 'internal_error'
    http_status = 500
    user_message = 'Something went wrong. Please try again.'

    def __init__(self, message: Optional[str] = None):
        super().__init__(message or self.user_message)
        self.user_message = message or self.user_message

    def to_payload(self) -> Dict[str, Any]:
        return {
            'ok': False,
            'error': {
                'code': self.code,
                'message': self.user_message,
            },
        }


class UnauthorizedError(MediAIError):
    code = 'unauthorized'
    http_status = 401
    user_message = 'Authentication is required to access this resource.'


class ForbiddenError(MediAIError):
    code = 'forbidden'
    http_status = 403
    user_message = 'You are not authorized to perform this action.'


class RateLimitedError(MediAIError):
    code = 'rate_limited'
    http_status = 429
    user_message = 'Too many requests. Please wait a moment and try again.'


class EmptyMessageError(MediAIError):
    code = 'empty_message'
    http_status = 400
    user_message = 'Message cannot be empty.'


class OversizedMessageError(MediAIError):
    code = 'message_too_large'
    http_status = 400
    user_message = 'Message is too long. Please shorten it and try again.'


class InvalidLanguageError(MediAIError):
    code = 'invalid_language'
    http_status = 400
    user_message = 'This language is not supported by Medi-AI.'


class ConversationNotFoundError(MediAIError):
    code = 'conversation_not_found'
    http_status = 404
    user_message = 'Conversation not found.'


class ProviderNotConfiguredError(MediAIError):
    code = 'provider_not_configured'
    http_status = 503
    user_message = (
        'Medi-AI is temporarily unavailable. Please try again later.'
    )


class ProviderUnavailableError(MediAIError):
    code = 'provider_unavailable'
    http_status = 503
    user_message = (
        'Medi-AI is temporarily unavailable. Please try again in a few minutes.'
    )


class ProviderQuotaExceededError(MediAIError):
    code = 'provider_quota_exceeded'
    http_status = 503
    user_message = (
        'Medi-AI is experiencing high demand and is temporarily unavailable. '
        'Please try again later.'
    )


class ProviderTimeoutError(MediAIError):
    code = 'provider_timeout'
    http_status = 503
    user_message = (
        'Medi-AI took too long to respond. Please try again.'
    )


class ProviderInvalidKeyError(MediAIError):
    code = 'provider_invalid_key'
    http_status = 503
    user_message = (
        'Medi-AI is temporarily unavailable. Please try again later.'
    )


class MalformedResponseError(MediAIError):
    code = 'malformed_ai_response'
    http_status = 502
    user_message = (
        'Medi-AI returned an unreadable response. Please try again.'
    )


class SafetyEngineFailureError(MediAIError):
    code = 'safety_engine_failure'
    http_status = 503
    user_message = (
        'Medi-AI is unable to respond safely right now. '
        'If you are unwell, please contact a healthcare professional.'
    )


class AppwriteUnavailableError(MediAIError):
    code = 'appwrite_unavailable'
    http_status = 503
    user_message = (
        'Your health records could not be loaded. Please try again later.'
    )


class ToolAuthorizationError(MediAIError):
    code = 'tool_forbidden'
    http_status = 403
    user_message = 'You are not authorized to use this tool.'


class AppointmentError(MediAIError):
    code = 'appointment_error'
    http_status = 400
    user_message = 'The appointment request could not be created.'


def error_response(exc: MediAIError) -> tuple:
    """Return (payload, http_status) for a safe error response.

    Only the stable ``code`` is exposed; internal exception class names are
    never serialized to clients.
    """
    return exc.to_payload(), exc.http_status