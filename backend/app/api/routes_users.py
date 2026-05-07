from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ChatMessage, EmotionalState, FocusRound, Progress, Ritual, TaskBox, User, UserStudyState
from app.db.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserResponse)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(display_name=payload.display_name or "Гость", telegram_id=payload.telegram_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(Progress(user_id=user.id))
    db.commit()
    return {"user_id": user.id, "display_name": user.display_name or "Гость"}


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user.id, "display_name": user.display_name or "Гость"}


@router.post("/{user_id}/reset")
def reset_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for model in [EmotionalState, ChatMessage, Ritual, TaskBox, FocusRound, UserStudyState, Progress]:
        db.query(model).filter(model.user_id == user_id).delete()
    db.add(Progress(user_id=user_id))
    db.commit()
    return {"message": "Данные пользователя сброшены."}

