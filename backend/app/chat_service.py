import logging
from .database import SessionLocal
from .models import Conversation, Message, AIUsageLog, User
from .ai_provider import get_provider
from sqlalchemy.orm import joinedload


class ChatService:
    def __init__(self, provider_name=None):
        self.provider = get_provider(provider_name)

    def create_conversation(self, user_id=None, title=None, language=None):
        db = SessionLocal()
        conv = Conversation(user_id=user_id, title=title, language=language)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        db.close()
        return conv

    def get_conversation(self, conv_id):
        db = SessionLocal()
        conv = db.query(Conversation).options(joinedload(Conversation.messages)).get(conv_id)
        db.close()
        return conv

    def add_message(self, conv_id, role, content, meta_data=None):
        db = SessionLocal()
        msg = Message(conversation_id=conv_id, role=role, content=content, meta_data=meta_data)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        db.close()
        return msg

    def generate_reply(self, conv_id, system_prompt=None, model_kwargs=None):
        # Build prompt from conversation
        db = SessionLocal()
        conv = db.query(Conversation).options(joinedload(Conversation.messages)).get(conv_id)
        messages = []
        if system_prompt:
            messages.append({'role': 'system', 'content': system_prompt})
        for m in conv.messages:
            messages.append({'role': m.role, 'content': m.content})

        # call provider
        try:
            resp = self.provider.generate(messages, **(model_kwargs or {}))
        except Exception as e:
            logging.exception('AI provider generate() failed')
            raise

        # parse provider response (supports dict-like or OpenAI-style normalized dict)
        text = ''
        try:
            choices = []
            if isinstance(resp, dict):
                choices = resp.get('choices', [])
            else:
                # attempt attribute access
                choices = getattr(resp, 'choices', []) or []

            for choice in choices:
                # choice may be dict or object
                if isinstance(choice, dict):
                    msg = choice.get('message') or {}
                    text += msg.get('content', '')
                else:
                    # object-like
                    m = getattr(choice, 'message', None)
                    if m:
                        text += (m.get('content') if isinstance(m, dict) else getattr(m, 'content', ''))
                    else:
                        text += getattr(choice, 'text', '') or ''
        except Exception:
            logging.exception('Failed to parse provider response')

        # Save assistant message
        assistant = Message(conversation_id=conv_id, role='assistant', content=text)
        db.add(assistant)
        db.commit()
        db.refresh(assistant)

        # Log usage
        try:
            log = AIUsageLog(provider=type(self.provider).__name__, model=model_kwargs.get('model') if model_kwargs else None, prompt_summary=(messages[-1]['content'] if messages else None))
            db.add(log)
            db.commit()
        except Exception:
            logging.exception('Failed to write AI usage log')

        db.close()
        return assistant
