from sqlalchemy.orm import Session
from app.db.models import UserStudyState


def get_state(db: Session, user_id: str) -> UserStudyState | None:
    return db.query(UserStudyState).filter(UserStudyState.user_id == user_id).first()

