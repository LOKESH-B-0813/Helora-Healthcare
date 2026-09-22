"""LLM provider abstraction layer for Medi-AI.

Providers are swappable: the rest of Medi-AI depends only on this interface.
"""
from .base import LLMProvider
from .dummy import DummyProvider
from .factory import get_provider
from .gemini import GeminiProvider

__all__ = ['LLMProvider', 'GeminiProvider', 'DummyProvider', 'get_provider']