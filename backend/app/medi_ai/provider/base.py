"""LLMProvider interface.

Medi-AI talks to AI models only through this abstraction. To add a new
provider (e.g. Azure OpenAI, a local model), implement this interface and
register it in ``factory.get_provider``.
"""
import abc
from typing import Any, Dict, Iterator, List, Optional

from ..schemas.base import ChatTurn, ProviderResult


class LLMProvider(abc.ABC):
    name: str = 'base'

    @property
    def supports_streaming(self) -> bool:
        return False

    @property
    def supports_multimodal(self) -> bool:
        return False

    @abc.abstractmethod
    def chat(
        self,
        turns: List[ChatTurn],
        *,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
        language: str = 'en',
        **kwargs: Any,
    ) -> ProviderResult:
        """Return a single complete text reply."""

    def stream_chat(
        self,
        turns: List[ChatTurn],
        *,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
        language: str = 'en',
        **kwargs: Any,
    ) -> Iterator[str]:
        """Yield progressive text deltas when streaming is supported."""
        raise NotImplementedError('Streaming is not supported by this provider')

    @abc.abstractmethod
    def structured(
        self,
        turns: List[ChatTurn],
        response_schema: Dict[str, Any],
        *,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.2,
        language: str = 'en',
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Return a JSON object matching ``response_schema``."""

    def analyze_media(self, prompt: str, media: Any, **kwargs: Any):
        """Future image/document analysis. Not implemented by default."""
        raise NotImplementedError(
            'Multimodal media analysis is not yet supported'
        )

    def health_context_prompt(
        self, turns: List[ChatTurn], context: Dict[str, Any], **kwargs: Any
    ) -> List[ChatTurn]:
        """Hook for providers that need a differently-shaped context."""
        return turns