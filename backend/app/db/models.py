import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


def uuid_str() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=uuid_str)
    telegram_id = Column(String, nullable=True, unique=True, index=True)
    display_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    state = relationship("UserStudyState", back_populates="user", uselist=False, cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserStudyState(Base):
    __tablename__ = "user_study_states"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), unique=True, index=True)
    current_topic = Column(Text, nullable=True)
    current_task = Column(Text, nullable=True)
    deadline_text = Column(String, nullable=True)
    energy_score = Column(Integer, nullable=True)
    last_recommended_mode = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="state")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    channel = Column(String, default="web")
    role = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmotionalState(Base):
    __tablename__ = "emotional_states"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    message_id = Column(String, ForeignKey("chat_messages.id"), index=True)
    tiredness_score = Column(Integer, default=0)
    anxiety_score = Column(Integer, default=0)
    deadline_pressure = Column(Integer, default=0)
    study_readiness = Column(Integer, default=0)
    overload_score = Column(Integer, default=0)
    procrastination_probability = Column(Integer, default=0)
    detected_intent = Column(String, default="unknown")
    short_reason = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Ritual(Base):
    __tablename__ = "rituals"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    ritual_type = Column(String)
    status = Column(String, default="started")
    duration_minutes = Column(Integer, nullable=True)
    input_text = Column(Text, nullable=True)
    output_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class TaskBox(Base):
    __tablename__ = "task_boxes"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    scary_task = Column(Text)
    micro_steps_json = Column(Text)
    locked_until_readiness = Column(Integer, default=5)
    is_opened = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    opened_at = Column(DateTime, nullable=True)


class FocusRound(Base):
    __tablename__ = "focus_rounds"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    task_title = Column(String)
    task_text = Column(Text)
    duration_minutes = Column(Integer, default=10)
    success_condition = Column(Text)
    status = Column(String, default="started")
    user_result = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class Progress(Base):
    __tablename__ = "progress"
    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, ForeignKey("users.id"), unique=True, index=True)
    rest_shards = Column(Integer, default=0)
    sleepy_kitten_level = Column(Integer, default=0)
    completed_focus_rounds = Column(Integer, default=0)
    completed_rituals = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="progress")

