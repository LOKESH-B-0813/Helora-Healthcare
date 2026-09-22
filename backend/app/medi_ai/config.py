"""Medi-AI configuration loaded from the Flask app / environment.

All secrets live in server-side environment variables only. This module never
exposes them to the response layer.
"""
import os

DISCLAIMER_EN = (
    'Helora Medi-AI provides health information and decision-support '
    'assistance and is not a substitute for professional medical care.'
)

EMERGENCY_NOTICE_EN = (
    'If you are experiencing a medical emergency, call your local emergency '
    'number (112 in India) or go to the nearest emergency department.'
)

SUPPORTED_LANGUAGES = ('en', 'ta', 'hi', 'te', 'ml', 'kn')

# Version marker for the deterministic safety rule set. Bump when rules change
# so clinical review/versioning can be tracked externally.
EMERGENCY_RULES_VERSION = '1.3.0'


class MediAIConfig:
    def __init__(self, app=None):
        self.provider = 'gemini'
        self.model = 'gemini-2.5-flash'
        self.fallback_model = ''
        self.fallback_api_key = ''
        self.api_key = ''
        self.max_message_length = 4000
        self.max_conversation_messages = 40
        self.max_context_chars = 8000
        self.provider_timeout_seconds = 45
        self.provider_retries = 1
        self.max_output_tokens = 1024
        self.rate_limit_auth_per_hour = 60
        self.rate_limit_anon_per_hour = 10
        self.rate_limit_window_seconds = 3600
        self.supported_languages = list(SUPPORTED_LANGUAGES)
        self.emergency_rules_version = EMERGENCY_RULES_VERSION
        self.disclaimer = DISCLAIMER_EN
        self.emergency_notice = EMERGENCY_NOTICE_EN
        self.init_app(app)

    def init_app(self, app):
        env = os.environ
        cfg = app.config if app is not None else {}

        self.provider = env.get('MEDI_AI_PROVIDER') or 'gemini'
        self.model = env.get('GEMINI_MODEL') or cfg.get('GEMINI_MODEL') or 'gemini-2.5-flash'
        self.fallback_model = env.get('GEMINI_FALLBACK_MODEL') or cfg.get('GEMINI_FALLBACK_MODEL') or ''
        self.fallback_api_key = env.get('GEMINI_FALLBACK_API_KEY') or cfg.get('GEMINI_FALLBACK_API_KEY') or ''
        self.api_key = env.get('GEMINI_API_KEY') or cfg.get('GEMINI_API_KEY') or ''
        self.max_message_length = int(env.get('MEDI_AI_MAX_MESSAGE_LENGTH', cfg.get('MEDI_AI_MAX_MESSAGE_LENGTH', 4000)))
        self.max_conversation_messages = int(env.get('MEDI_AI_MAX_MESSAGES', cfg.get('MEDI_AI_MAX_MESSAGES', 40)))
        self.max_context_chars = int(env.get('MEDI_AI_MAX_CONTEXT_CHARS', cfg.get('MEDI_AI_MAX_CONTEXT_CHARS', 8000)))
        self.provider_timeout_seconds = float(env.get('MEDI_AI_PROVIDER_TIMEOUT', cfg.get('MEDI_AI_PROVIDER_TIMEOUT', 45)))
        self.provider_retries = int(env.get('MEDI_AI_RETRIES', cfg.get('MEDI_AI_RETRIES', 1)))
        self.max_output_tokens = int(env.get('MEDI_AI_MAX_OUTPUT_TOKENS', cfg.get('MEDI_AI_MAX_OUTPUT_TOKENS', 1024)))
        self.rate_limit_auth_per_hour = int(env.get('MEDI_AI_RATE_AUTH_PER_HOUR', cfg.get('MEDI_AI_RATE_AUTH_PER_HOUR', 60)))
        self.rate_limit_anon_per_hour = int(env.get('MEDI_AI_RATE_ANON_PER_HOUR', cfg.get('MEDI_AI_RATE_ANON_PER_HOUR', 10)))
        self.rate_limit_window_seconds = int(env.get('MEDI_AI_RATE_WINDOW_SECONDS', cfg.get('MEDI_AI_RATE_WINDOW_SECONDS', 3600)))

    def public_overview(self) -> dict:
        """Non-secret configuration exposed to clients."""
        return {
            'provider_enabled': bool(self.api_key) or self.provider == 'dummy',
            'model': self.model if self.provider != 'dummy' else 'local-simulation',
            'languages': self.supported_languages,
            'max_message_length': self.max_message_length,
            'emergency_rules_version': self.emergency_rules_version,
            'disclaimer': self.disclaimer,
            'emergency_notice': self.emergency_notice,
        }