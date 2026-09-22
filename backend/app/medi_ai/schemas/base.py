"""Shared data structures for the Medi-AI subsystem."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

URGENCY_LEVELS = ('routine', 'soon', 'urgent', 'emergency')

LANGUAGE_CODES = ('en', 'ta', 'hi', 'te', 'ml', 'kn')


class ChatTurn(BaseModel):
    role: str  # system | user | assistant
    content: str


class IntentResult(BaseModel):
    intent: str  # symptom | medication | report | general | triage | specialist | appointment
    topic: str = ''
    medical_category: str = ''
    confidence_words: List[str] = Field(default_factory=list)


class SafetyClassification(BaseModel):
    urgency: str = 'routine'
    needs_follow_up: bool = True
    flags: List[str] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)
    recommended_specialty: Optional[str] = None
    matched_rules: List[str] = Field(default_factory=list)
    rules_version: str = ''


class KnowledgeHit(BaseModel):
    document_id: str
    title: str
    topic: str
    specialty: str = ''
    source: str = ''
    version: str = '1.0'
    effective_date: str = ''
    review_status: str = 'draft'
    match_score: int = 0
    matched_terms: List[str] = Field(default_factory=list)


class ProviderResult(BaseModel):
    text: str
    usage: Dict[str, Any] = Field(default_factory=dict)
    raw: Any = None


class MediAIStructuredResponse(BaseModel):
    """Canonical structured AI response.

    Only these curated fields are ever surfaced to the client. No hidden
    reasoning or chain-of-thought is included.
    """
    message: str
    urgency: str = 'routine'
    needs_follow_up: bool = False
    follow_up_questions: List[str] = Field(default_factory=list)
    possible_topics: List[str] = Field(default_factory=list)
    recommended_specialty: Optional[str] = None
    safety_flags: List[str] = Field(default_factory=list)
    sources: List[KnowledgeHit] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)


class ToolInvocation(BaseModel):
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)