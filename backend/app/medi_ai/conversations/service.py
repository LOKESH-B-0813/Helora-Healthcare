"""Persistent authenticated conversation storage backed by the existing ORM.

Ownership is enforced on every operation. Anonymous (guest) chats are
stateless and never create conversation records.
"""
import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import joinedload

from ...database import SessionLocal
from ...models import Conversation, Message
from ..schemas.base import ChatTurn

logger = logging.getLogger(__name__)

ACTIVE = 'active'
ARCHIVED = 'archived'
DELETED = 'deleted'

_TITLE_LIMIT = 60


class ConversationNotFoundError(Exception):
    pass


class ConversationService:
    def create(
        self,
        user_id: str,
        title: str = '',
        language: str = 'en',
    ) -> Conversation:
        if not user_id:
            raise ValueError('Conversation persistence requires an authenticated user')
        db = SessionLocal()
        try:
            conv = Conversation(
                user_id=user_id,
                title=title[: _TITLE_LIMIT] or None,
                language=language,
                status=ACTIVE,
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)
            return conv
        finally:
            db.close()

    def get(self, user_id: str, conv_id: int) -> Optional[Conversation]:
        """Fetch a conversation only if the authenticated user owns it."""
        db = SessionLocal()
        try:
            conv = (
                db.query(Conversation)
                .options(joinedload(Conversation.messages))
                .filter(Conversation.id == conv_id)
                .filter(Conversation.user_id == user_id)
                .filter((Conversation.status.in_([ACTIVE, ARCHIVED])))
                .first()
            )
            return conv
        finally:
            db.close()

    def list_active(self, user_id: str) -> List[Conversation]:
        db = SessionLocal()
        try:
            return (
                db.query(Conversation)
                .filter(Conversation.user_id == user_id)
                .filter((Conversation.status.in_([ACTIVE, ARCHIVED])))
                .order_by(Conversation.updated_at.desc())
                .all()
            )
        finally:
            db.close()

    def rename(self, user_id: str, conv_id: int, title: str) -> Optional[Conversation]:
        db = SessionLocal()
        try:
            conv = (
                db.query(Conversation)
                .filter(Conversation.id == conv_id, Conversation.user_id == user_id)
                .first()
            )
            if not conv:
                return None
            conv.title = (title or '').strip()[: _TITLE_LIMIT] or 'Untitled'
            conv.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(conv)
            return conv
        finally:
            db.close()

    def archive(self, user_id: str, conv_id: int) -> bool:
        db = SessionLocal()
        try:
            conv = (
                db.query(Conversation)
                .filter(Conversation.id == conv_id, Conversation.user_id == user_id)
                .first()
            )
            if not conv:
                return False
            conv.status = ARCHIVED
            conv.updated_at = datetime.utcnow()
            db.commit()
            return True
        finally:
            db.close()

    def delete(self, user_id: str, conv_id: int) -> bool:
        """Hard-delete a conversation and all of its messages (cascade)."""
        db = SessionLocal()
        try:
            conv = (
                db.query(Conversation)
                .filter(Conversation.id == conv_id, Conversation.user_id == user_id)
                .first()
            )
            if not conv:
                return False
            db.delete(conv)
            db.commit()
            return True
        finally:
            db.close()

    def add_message(
        self,
        user_id: str,
        conv_id: int,
        role: str,
        content: str,
        meta_data=None,
    ) -> Optional[Message]:
        db = SessionLocal()
        try:
            conv = (
                db.query(Conversation)
                .filter(Conversation.id == conv_id, Conversation.user_id == user_id)
                .first()
            )
            if not conv:
                return None
            message = Message(
                conversation_id=conv_id,
                role=role,
                content=content,
                meta_data=meta_data,
            )
            db.add(message)
            conv.updated_at = datetime.utcnow()
            if not conv.title:
                conv.title = self._derive_title(content)
            db.commit()
            db.refresh(message)
            return message
        finally:
            db.close()

    def set_language(self, user_id: str, conv_id: int, language: str) -> Optional[Conversation]:
        db = SessionLocal()
        try:
            conv = (
                db.query(Conversation)
                .filter(Conversation.id == conv_id, Conversation.user_id == user_id)
                .first()
            )
            if not conv:
                return None
            conv.language = language
            conv.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(conv)
            return conv
        finally:
            db.close()

    def clear_messages(self, user_id: str, conv_id: int) -> bool:
        db = SessionLocal()
        try:
            conv = (
                db.query(Conversation)
                .filter(Conversation.id == conv_id, Conversation.user_id == user_id)
                .first()
            )
            if not conv:
                return False
            for message in conv.messages:
                db.delete(message)
            conv.updated_at = datetime.utcnow()
            db.commit()
            return True
        finally:
            db.close()

    def build_context(
        self,
        conv_id: int,
        max_messages: int = 40,
        max_chars: int = 8000,
    ) -> List[ChatTurn]:
        """Return a limited, ordered context for the provider prompt."""
        db = SessionLocal()
        try:
            messages = (
                db.query(Message)
                .filter(Message.conversation_id == conv_id)
                .order_by(Message.created_at.asc(), Message.id.asc())
                .all()
            )
        finally:
            db.close()

        context: List[ChatTurn] = []
        used_chars = 0
        for message in messages[-max_messages:]:
            content = (message.content or '')[:max_chars - used_chars]
            context.append(ChatTurn(role=message.role, content=content))
            used_chars += len(content)
            if used_chars >= max_chars:
                break
        return context

    @staticmethod
    def as_dict(conv: Conversation) -> dict:
        return {
            'id': conv.id,
            'title': conv.title or 'Untitled',
            'language': conv.language or 'en',
            'status': conv.status or ACTIVE,
            'urgency_level': conv.urgency_level,
            'created_at': conv.created_at.isoformat() if conv.created_at else None,
            'updated_at': conv.updated_at.isoformat() if conv.updated_at else None,
        }

    @staticmethod
    def message_to_dict(message: Message) -> dict:
        payload = {
            'id': message.id,
            'role': message.role,
            'content': message.content,
            'created_at': message.created_at.isoformat() if message.created_at else None,
        }
        if message.meta_data and message.meta_data.get('sources'):
            payload['sources'] = message.meta_data.get('sources')
        if message.meta_data and message.meta_data.get('safety_flags'):
            payload['safety_flags'] = message.meta_data.get('safety_flags')
        if message.meta_data and message.meta_data.get('recommended_specialty'):
            payload['recommended_specialty'] = message.meta_data.get('recommended_specialty')
        if message.meta_data and message.meta_data.get('urgency'):
            payload['urgency'] = message.meta_data.get('urgency')
        return payload

    @staticmethod
    def _derive_title(content: str) -> str:
        cleaned = ' '.join((content or '').split())
        if not cleaned:
            return 'Untitled'
        return cleaned[: _TITLE_LIMIT] + ('...' if len(cleaned) > _TITLE_LIMIT else '')