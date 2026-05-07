from typing import Any, Literal
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    display_name: str | None = None
    telegram_id: str | None = None


class UserResponse(BaseModel):
    user_id: str
    display_name: str


class StateUpsert(BaseModel):
    user_id: str
    current_topic: str | None = None
    current_task: str | None = None
    deadline_text: str | None = None
    energy_score: int | None = Field(default=None, ge=0, le=10)


class StateResponse(StateUpsert):
    last_recommended_mode: str | None = None


class ChatRequest(BaseModel):
    user_id: str
    channel: Literal["web", "telegram"] = "web"
    message: str


class RitualStartRequest(BaseModel):
    user_id: str
    ritual_type: Literal["cat_mode", "anxiety_eater", "task_burner"]


class RitualCompleteRequest(BaseModel):
    user_id: str
    ritual_id: str


class AnxietyRequest(BaseModel):
    user_id: str
    anxiety_text: str


class TaskBurnerRequest(BaseModel):
    user_id: str
    scary_task: str


class FocusStartRequest(BaseModel):
    user_id: str


class FocusCompleteRequest(BaseModel):
    user_id: str
    focus_round_id: str
    user_result: str | None = None


class ChatResponse(BaseModel):
    reply: str
    emotional_state: dict[str, Any]
    recommended_mode: str
    suggested_actions: list[dict[str, str]]

