from app.db.database import Base, engine, SessionLocal
from app.services.gamification_service import get_or_create_progress, reward_focus, reward_ritual


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_ritual_reward_adds_shard():
    db = SessionLocal()
    try:
        assert reward_ritual(db, "u1")["rest_shards"] == 1
    finally:
        db.close()


def test_focus_reward_adds_shard():
    db = SessionLocal()
    try:
        assert reward_focus(db, "u2")["rest_shards"] == 1
    finally:
        db.close()


def test_level_at_ten_shards():
    db = SessionLocal()
    try:
        progress = get_or_create_progress(db, "u3")
        progress.rest_shards = 9
        db.commit()
        assert reward_focus(db, "u3")["sleepy_kitten_level"] == 1
    finally:
        db.close()


def test_sleepy_kitten_progress():
    db = SessionLocal()
    try:
        progress = get_or_create_progress(db, "u4")
        progress.rest_shards = 14
        db.commit()
        assert reward_ritual(db, "u4")["sleepy_kitten_progress"] == 50
    finally:
        db.close()

