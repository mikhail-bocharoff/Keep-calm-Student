from datetime import datetime
from sqlalchemy.orm import Session
from app.core.llm import get_llm_client
from app.db.models import ChatMessage, FocusRound
from app.services.gamification_service import reward_focus
from app.services.topic_service import get_state


async def build_focus_task(db: Session, user_id: str) -> dict:
    state = get_state(db, user_id)
    topic = state.current_topic if state and state.current_topic else "текущей теме"
    current_task = state.current_task if state and state.current_task else "учебной задаче"
    deadline = state.deadline_text if state and state.deadline_text else ""
    energy = state.energy_score if state and state.energy_score is not None else ""
    recent = db.query(ChatMessage).filter(ChatMessage.user_id == user_id, ChatMessage.role == "user").order_by(ChatMessage.created_at.desc()).limit(5).all()
    has_anxiety = any("трев" in msg.content.lower() or "дедлайн" in msg.content.lower() for msg in recent)
    if has_anxiety:
        text = f"Открой свои материалы по теме «{topic}» и выпиши 3 вопроса. Отвечать на них не надо, просто поймай."
    else:
        text = f"Открой {current_task.lower()} и найди один маленький кусок по теме «{topic}», который можно объяснить другу за кофе. Можно криво."
    fallback = {
        "task_title": "10 минут против часовых",
        "task_text": text,
        "duration_minutes": 10,
        "success_condition": "Пользователь сделал хотя бы один маленький след: вопрос, фразу или черновик.",
    }
    try:
        data = await get_llm_client().generate_json(
            system_prompt=(
                "Ты FocusFloat. Создай ультракороткий учебный раунд на 10 минут.\n"
                "Задача должна быть лёгкой, конкретной и связанной с темой студента. Без морализаторства.\n"
                "Верни строго JSON с ключами task_title, task_text, duration_minutes, success_condition."
            ),
            user_prompt=(
                f"Тема: {topic}\n"
                f"Текущая задача: {current_task}\n"
                f"Дедлайн: {deadline}\n"
                f"Энергия 0-10: {energy}\n"
                f"Недавние сообщения: {' | '.join(msg.content for msg in recent)}\n"
            ),
            temperature=0.35,
        )
        return {
            "task_title": str(data.get("task_title") or fallback["task_title"])[:120],
            "task_text": str(data.get("task_text") or fallback["task_text"]),
            "duration_minutes": int(data.get("duration_minutes") or 10),
            "success_condition": str(data.get("success_condition") or fallback["success_condition"]),
        }
    except Exception:
        return fallback


async def start_focus_round(db: Session, user_id: str) -> dict:
    task = await build_focus_task(db, user_id)
    focus = FocusRound(user_id=user_id, **task)
    db.add(focus)
    db.commit()
    db.refresh(focus)
    return {"focus_round_id": focus.id, **task}


def complete_focus_round(db: Session, user_id: str, focus_round_id: str, user_result: str | None) -> dict:
    focus = db.query(FocusRound).filter(FocusRound.id == focus_round_id, FocusRound.user_id == user_id).first()
    if not focus:
        raise ValueError("Focus round not found")
    if focus.status != "completed":
        focus.status = "completed"
        focus.user_result = user_result
        focus.completed_at = datetime.utcnow()
        db.commit()
        reward = reward_focus(db, user_id)
    else:
        from app.services.gamification_service import get_or_create_progress, progress_payload
        reward = progress_payload(get_or_create_progress(db, user_id))
    return {
        "message": "+1 Осколок отдыха. Сонный котёнок стал чуть пушистее. Он ничего от тебя не требует, просто сопит рядом с прогрессом.",
        "reward": {"rest_shards_added": 1, "total_rest_shards": reward["rest_shards"], **reward},
    }
