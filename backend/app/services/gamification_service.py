from datetime import datetime
from sqlalchemy.orm import Session
from app.db.models import Progress


def get_or_create_progress(db: Session, user_id: str) -> Progress:
    progress = db.query(Progress).filter(Progress.user_id == user_id).first()
    if not progress:
        progress = Progress(user_id=user_id)
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return progress


def apply_sleepy_kitten(progress: Progress) -> Progress:
    progress.sleepy_kitten_level = progress.rest_shards // 10
    progress.updated_at = datetime.utcnow()
    return progress


def progress_payload(progress: Progress) -> dict:
    apply_sleepy_kitten(progress)
    return {
        "rest_shards": progress.rest_shards,
        "sleepy_kitten_level": progress.sleepy_kitten_level,
        "sleepy_kitten_progress": (progress.rest_shards % 10) * 10,
        "completed_focus_rounds": progress.completed_focus_rounds,
        "completed_rituals": progress.completed_rituals,
    }


def reward_ritual(db: Session, user_id: str) -> dict:
    progress = get_or_create_progress(db, user_id)
    progress.rest_shards += 1
    progress.completed_rituals += 1
    apply_sleepy_kitten(progress)
    db.commit()
    db.refresh(progress)
    return progress_payload(progress)


def reward_focus(db: Session, user_id: str) -> dict:
    progress = get_or_create_progress(db, user_id)
    progress.rest_shards += 1
    progress.completed_focus_rounds += 1
    apply_sleepy_kitten(progress)
    db.commit()
    db.refresh(progress)
    return progress_payload(progress)

