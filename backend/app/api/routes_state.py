from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import UserStudyState
from app.db.schemas import StateResponse, StateUpsert

router = APIRouter(prefix="/api/state", tags=["state"])


@router.post("", response_model=StateResponse)
def upsert_state(payload: StateUpsert, db: Session = Depends(get_db)):
    state = db.query(UserStudyState).filter(UserStudyState.user_id == payload.user_id).first()
    if not state:
        state = UserStudyState(user_id=payload.user_id)
        db.add(state)
    state.current_topic = payload.current_topic
    state.current_task = payload.current_task
    state.deadline_text = payload.deadline_text
    state.energy_score = payload.energy_score
    db.commit()
    db.refresh(state)
    return {**payload.model_dump(), "last_recommended_mode": state.last_recommended_mode}


@router.get("/{user_id}", response_model=StateResponse)
def get_state(user_id: str, db: Session = Depends(get_db)):
    state = db.query(UserStudyState).filter(UserStudyState.user_id == user_id).first()
    if not state:
        return {"user_id": user_id, "current_topic": None, "current_task": None, "deadline_text": None, "energy_score": None, "last_recommended_mode": None}
    return {
        "user_id": user_id,
        "current_topic": state.current_topic,
        "current_task": state.current_task,
        "deadline_text": state.deadline_text,
        "energy_score": state.energy_score,
        "last_recommended_mode": state.last_recommended_mode,
    }

