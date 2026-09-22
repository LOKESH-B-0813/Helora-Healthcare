"""Provider factory. Swap the AI provider here without touching the rest of
Medi-AI."""
from typing import Optional

from .base import LLMProvider
from .dummy import DummyProvider
from .gemini import GeminiProvider


def get_provider(
    name: Optional[str] = 'gemini',
    *,
    api_key: str = '',
    timeout_seconds: float = 45,
    retries: int = 1,
    fallback_model: str = '',
    fallback_api_key: str = '',
) -> LLMProvider:
    provider_name = (name or 'gemini').lower()
    if provider_name == 'gemini':
        return GeminiProvider(
            api_key=api_key,
            timeout_seconds=timeout_seconds,
            retries=retries,
            fallback_model=fallback_model,
            fallback_api_key=fallback_api_key,
        )
    if provider_name == 'dummy':
        return DummyProvider()
    raise ValueError(f'Unknown Medi-AI provider: {provider_name}')