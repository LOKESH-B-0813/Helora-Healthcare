from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    firebase_uid = Column(String(200), unique=True, index=True, nullable=True)
    email = Column(String(200), unique=True, index=True, nullable=True)
    role = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(Integer, primary_key=True)
    # External identity (Appwrite user ID) stored as an opaque string. Ownership
    # is enforced by the conversation service, never trusted from the client.
    user_id = Column(String(200), index=True, nullable=True)
    title = Column(String(255), nullable=True)
    language = Column(String(50), nullable=True)
    status = Column(String(20), nullable=True, default='active')  # active | archived | deleted
    requires_human_review = Column(Boolean, default=False)
    urgency_level = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    messages = relationship('Message', back_populates='conversation', cascade='all, delete-orphan')


class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id'))
    role = Column(String(20))  # user | assistant | system
    content = Column(Text)
    meta_data = Column('meta_data', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    conversation = relationship('Conversation', back_populates='messages')


class MessageFeedback(Base):
    __tablename__ = 'message_feedback'
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('messages.id'))
    helpful = Column(Boolean)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIUsageLog(Base):
    __tablename__ = 'ai_usage_logs'
    id = Column(Integer, primary_key=True)
    provider = Column(String(50))
    model = Column(String(200))
    prompt_summary = Column(Text, nullable=True)
    tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
