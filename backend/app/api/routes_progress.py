from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.gamification_service import get_or_create_progress, progress_payload

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/{user_id}")
def get_progress(user_id: str, db: Session = Depends(get_db)):
    return progress_payload(get_or_create_progress(db, user_id))

