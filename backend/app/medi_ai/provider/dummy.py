"""Deterministic provider used for local development and automated tests.

Never used to simulate clinical answers for real users in a way that could be
mistaken for real guidance; the orchestrator adds discovery + disclaimer text
on top of everything, and this provider emits only neutral, non-clinical text.
"""
import json
from typing import Any, Dict, Iterator, List, Optional

from ..errors import MalformedResponseError
from .base import LLMProvider
from ..schemas.base import ChatTurn, ProviderResult

_DUMMY_MESSAGE_TEMPLATE = (
    'This is a local simulation response used for development and automated '
    'testing. It does not contain medical guidance. If you are unwell, please '
    'speak with a qualified healthcare professional.'
)


class DummyProvider(LLMProvider):
    name = 'dummy'

    @property
    def supports_streaming(self) -> bool:
        return True

    def _reply_text(self, language: str = 'en') -> str:
        if language == 'ta':
            return (
                'இந்தப் பதில் உள்ளூர் சோதனைக்காக உருவாக்கப்பட்டதாகும். '
                'இது மருத்துவ ஆலோசனையல்ல.'
            )
        if language == 'hi':
            return (
                'यह उत्तर स्थानीय परीक्षण के लिए उत्पन्न किया गया है। '
                'यह चिकित्सा सलाह नहीं है।'
            )
        if language == 'te':
            return (
                'ఈ సమాధానం స్థానిక పరీక్ష కోసం రూపొందించబడింది. '
                'ఇది వైద్య సలహా కాదు.'
            )
        if language == 'ml':
            return (
                'ഈ ഉത്തരം പ്രാദേശിക പരിശോധനയ്ക്കായി സൃഷ്ടിച്ചതാണ്. '
                'ഇത് മെഡിക്കൽ ഉപദേശമല്ല.'
            )
        if language == 'kn':
            return (
                'ಈ ಉತ್ತರವನ್ನು ಸ್ಥಳೀಯ ಪರೀಕ್ಷೆಗಾಗಿ ರಚಿಸಲಾಗಿದೆ. '
                'ಇದು ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ.'
            )
        return _DUMMY_MESSAGE_TEMPLATE

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
        return ProviderResult(text=self._reply_text(language))

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
        for word in self._reply_text(language).split(' '):
            yield word + ' '

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
        simulated = kwargs.get('simulated_response')
        if simulated is not None:
            if isinstance(simulated, dict):
                return simulated
            if isinstance(simulated, str):
                simulated = json.loads(simulated)
                if isinstance(simulated, dict):
                    return simulated
            raise MalformedResponseError()
        return {
            'message': self._reply_text(language),
            'urgency': 'routine',
            'needs_follow_up': False,
            'follow_up_questions': [],
            'possible_topics': [],
            'recommended_specialty': None,
            'safety_flags': [],
            'sources': [],
            'actions': [],
        }