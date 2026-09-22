"""Request/result data models for the chat pipeline."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from ..schemas.base import MediAIStructuredResponse, KnowledgeHit


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    language: str = 'en'
    use_patient_data: bool = False
    tools: List[str] = Field(default_factory=list)
    stream: bool = False


class ChatResult(BaseModel):
    conversation_id: Optional[int] = None
    user_message_id: Optional[int] = None
    assistant_message_id: Optional[int] = None
    structured: MediAIStructuredResponse
    anonymous: bool = False
    provider_name: str = ''
    persisted: bool = False
    specialist_reason: str = ''


class StreamingEvent(BaseModel):
    type: str  # 'start' | 'delta' | 'done' | 'error'
    data: Any = None