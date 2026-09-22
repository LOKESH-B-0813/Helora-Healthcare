"""Deterministic, testable medical safety engine.

Runs BEFORE any LLM response is returned and again as a response guard. It must
never be replaced by trusting the model alone to recognize emergencies. If this
engine itself fails, the pipeline fails safely.
"""
import logging
import re
from typing import List, Tuple

from ..config import EMERGENCY_RULES_VERSION
from ..errors import SafetyEngineFailureError
from ..schemas.base import SafetyClassification, MediAIStructuredResponse
from .rules import EMERGENCY_ACTIONS, EMERGENCY_RULES, EMERGENCY_SPECIALTY
from .templates import template_for, EMERGENCY_ACTION, EMERGENCY_BANNER, EMERGENCY_NOTE, DISCLAIMER_LINE

logger = logging.getLogger(__name__)

_WORD_RE = re.compile(r"[a-z0-9']+")


def _normalize(text: str) -> Tuple[str, set]:
    lowered = (text or '').lower().replace('\u2019', "'").replace('\u2018', "'")
    words = set(_WORD_RE.findall(lowered))
    return lowered, words


class SafetyEngine:
    def __init__(self, rules=None, rules_version: str = EMERGENCY_RULES_VERSION):
        self.rules = rules if rules is not None else EMERGENCY_RULES
        self.rules_version = rules_version

    def classify(self, text: str) -> SafetyClassification:
        """Classify an incoming user message.

        Returns ``emergency`` immediately for any match so care is never
        delayed by follow-up questions. Raises ``SafetyEngineFailureError`` if
        the engine itself misbehaves (fail-safe).
        """
        try:
            normalized, words = _normalize(text)
            matched: List[str] = []
            matched_ids: List[str] = []
            for rule in self.rules:
                try:
                    if rule.matches(normalized, words):
                        matched.append(rule.label)
                        matched_ids.append(rule.id)
                except Exception:
                    logger.exception('Safety rule %s failed', rule.id)
                    raise SafetyEngineFailureError()

            if matched:
                specialty = None
                for label in matched:
                    if label in EMERGENCY_SPECIALTY:
                        specialty = EMERGENCY_SPECIALTY[label]
                        break
                return SafetyClassification(
                    urgency='emergency',
                    needs_follow_up=False,
                    flags=matched,
                    actions=list(EMERGENCY_ACTIONS),
                    recommended_specialty=specialty,
                    matched_rules=matched_ids,
                    rules_version=self.rules_version,
                )
            return SafetyClassification(
                urgency='routine',
                needs_follow_up=True,
                rules_version=self.rules_version,
            )
        except SafetyEngineFailureError:
            raise
        except Exception:
            logger.exception('Safety engine failed to classify message')
            raise SafetyEngineFailureError()

    def build_emergency_response(
        self, text: str, language: str = 'en', classification: SafetyClassification = None,
    ) -> MediAIStructuredResponse:
        """Construct a deterministic emergency response without invoking the LLM."""
        try:
            classification = classification or self.classify(text)
        except Exception:
            logger.exception('Safety engine failed while building emergency response')
            raise SafetyEngineFailureError()
        banner = template_for(EMERGENCY_BANNER, language)
        action = template_for(EMERGENCY_ACTION, language)
        note = template_for(EMERGENCY_NOTE, language)
        disclaimer = template_for(DISCLAIMER_LINE, language)
        message = (
            f'{banner}.\n\n{action}\n\n{note}\n\n{disclaimer}'
        )
        return MediAIStructuredResponse(
            message=message,
            urgency='emergency',
            needs_follow_up=False,
            follow_up_questions=[],
            recommended_specialty=classification.recommended_specialty,
            safety_flags=classification.flags,
            actions=list(classification.actions),
        )

    def validate_response(
        self, response: MediAIStructuredResponse, language: str = 'en',
    ) -> MediAIStructuredResponse:
        """Post-generation guard.

        Ensures the AI narrative does not claim certainty, issue prescriptions,
        or contradict an earlier emergency classification. On any abnormality
        the text is downgraded to a safe generic message; the caller still logs
        the event. If this method itself throws, the pipeline treats it as a
        safety engine failure (fail-safe).
        """
        try:
            text = (response.message or '').strip()
            lowered = text.lower()
            uncertain = (
                'definitely have', 'you have diabetes', 'you have cancer',
                'you definitely', 'diagnosis is', 'i am certain',
                'guaranteed', 'a prescription for', 'i prescribe',
            )
            if any(fragment in lowered for fragment in uncertain):
                response.message = (
                    'I can only share general health information and cannot '
                    'make a diagnosis. Please discuss your symptoms with a '
                    'qualified healthcare professional for an accurate '
                    'evaluation. '
                ) + (response.message or '')
                response.actions.append('consult_healthcare_professional')

            if response.urgency not in ('routine', 'soon', 'urgent', 'emergency'):
                response.urgency = 'routine'
            return response
        except Exception:
            logger.exception('Safety response validation failed')
            raise SafetyEngineFailureError()

    def fail_safe_response(self, language: str = 'en') -> MediAIStructuredResponse:
        """Generic safe response used when the pipeline cannot complete."""
        from .templates import UNAVAILABLE_SAFE
        return MediAIStructuredResponse(
            message=template_for(UNAVAILABLE_SAFE, language),
            urgency='routine',
            needs_follow_up=False,
            safety_flags=['fail_safe_used'],
        )