from sqlalchemy.orm import Session
import logging

from app.config import get_settings
from app.core.llm import get_llm_client
from app.core.nlp.tiredness_analyzer import analyze_tiredness
from app.core.safety.risk_detector import SAFETY_RESPONSE, detect_risk
from app.core.safety.output_filter import soften_output
from app.db.models import ChatMessage, EmotionalState, User, UserStudyState

logger = logging.getLogger(__name__)

SUGGESTED_RITUALS = [
    {"type": "ritual", "id": "cat_mode", "title": "Кошачий режим"},
    {"type": "ritual", "id": "anxiety_eater", "title": "Пожиратель тревоги"},
    {"type": "ritual", "id": "task_burner", "title": "Сжечь страшную задачу"},
]


def choose_recommended_mode(emotional_state: dict) -> str:
    if emotional_state.get("risk_flags", {}).get("self_harm"):
        return "safety"
    if emotional_state.get("overload_score", 0) >= 8:
        return "recovery"
    if emotional_state.get("tiredness_score", 0) >= 8:
        return "recovery"
    if emotional_state.get("anxiety_score", 0) >= 7:
        return "anxiety_eater"
    if emotional_state.get("procrastination_probability", 0) >= 7:
        return "anti_guilt"
    if emotional_state.get("study_readiness", 0) >= 5:
        return "tiny_focus_round"
    return "gentle_chat"


def _reply_for(mode: str, state: dict) -> str:
    if mode == "safety":
        return SAFETY_RESPONSE
    if mode == "recovery":
        return (
            f"Похоже, перегрузка примерно {state.get('overload_score', state.get('tiredness_score', 8))}/10. "
            "Сейчас лучше не давить на себя учебой: сначала короткое восстановление, потом один простой шаг.\n\n"
            "Можно выбрать: 15 минут Кошачьего режима, Пожиратель тревоги или разбор страшной задачи на три микрошага."
        )
    if mode == "anxiety_eater":
        return "Тревога сейчас говорит слишком громко. Давай выпишем самую страшную мысль и переведем ее в один спокойный, проверяемый шаг."
    if mode == "anti_guilt":
        return "Окей, ты отвлекся. Это не приговор и не доказательство лени. Давай без самобичевания: либо 30 секунд на один микрошаг, либо короткий отдых."
    if mode == "tiny_focus_round":
        return "Кажется, сил хватает на маленький старт. Можно попробовать 10 минут против часовых: одна понятная задача, без идеала и героизма."
    return "Я рядом. Давай разберёмся мягко: что сейчас больше всего мешает - усталость, тревога, дедлайн или пустота в голове?"


async def _maybe_llm_reply(db: Session, user_id: str, message: str, mode: str, emotional: dict, base_reply: str) -> str:
    """
    Use configured LLM (mock/api/local) to produce a more natural coaching reply.
    Falls back to the existing rule-based reply if anything goes wrong.
    """
    try:
        client = get_llm_client()
        settings = get_settings()
        state = db.query(UserStudyState).filter(UserStudyState.user_id == user_id).first()
        recent = (
            db.query(ChatMessage)
            .filter(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(6)
            .all()
        )
        history = "\n".join(f"{msg.role}: {msg.content}" for msg in reversed(recent))
        logger.info("LLM: mode=%s client=%s model=%s base=%s has_key=%s",
                    settings.llm_mode,
                    type(client).__name__,
                    settings.llm_model_name,
                    settings.llm_base_url,
                    bool(settings.llm_api_key))
        system_prompt = (
            "Ты FocusFloat - бережный AI-коуч для студентов 16-24 лет.\n"
            "Пиши на живом русском: тепло, спокойно, без канцелярита, без сюсюканья и без кринжового сленга.\n"
            "Не ругай, не стыди, не дави мотивацией. Не ставь диагнозы и не обещай медицинский эффект.\n"
            "Ответ должен быть 3-6 коротких предложений. Сначала отрази состояние пользователя, затем предложи один понятный следующий шаг.\n"
            "Если уместно, предложи один из режимов: Кошачий режим, Пожиратель тревоги, Сжечь страшную задачу, 10 минут против часовых.\n"
            "Не используй фразы вроде 'финальный босс', 'мозг мигает лампочкой', 'ты гений', если пользователь сам не шутит в таком стиле.\n"
        )
        user_prompt = (
            f"Сообщение пользователя:\n{message}\n\n"
            f"Последние сообщения:\n{history or 'Истории пока нет.'}\n\n"
            "Учебный контекст:\n"
            f"тема={state.current_topic if state else None}; "
            f"задача={state.current_task if state else None}; "
            f"дедлайн={state.deadline_text if state else None}; "
            f"энергия={state.energy_score if state else None}\n\n"
            f"Режим: {mode}\n"
            f"Сигналы состояния (0-10): tiredness={emotional.get('tiredness_score')}, "
            f"anxiety={emotional.get('anxiety_score')}, deadline={emotional.get('deadline_pressure')}, "
            f"readiness={emotional.get('study_readiness')}, overload={emotional.get('overload_score')}, "
            f"procrastination={emotional.get('procrastination_probability')}\n\n"
            f"Черновик ответа (это только направление, не повторяй его дословно):\n{base_reply}\n\n"
            "Сформируй финальный ответ пользователю. "
            "Ответь именно на его фразу, особенно если она короткая вроде 'мне плохо' или 'мне нормально'. "
            "Не начинай каждый ответ одинаково. Верни только текст ответа."
        )
        text = await client.generate_text(system_prompt=system_prompt, user_prompt=user_prompt, temperature=0.7)
        return soften_output(text.strip()) if text else base_reply
    except Exception as exc:
        logger.exception("LLM reply generation failed; falling back to rule-based reply")
        if get_settings().llm_mode.lower() in {"api", "local"}:
            return (
                "Я вижу сообщение, но нейросетевой ответ сейчас не прошёл. "
                "Проверь `/api/health/llm`: там будет точная ошибка провайдера без раскрытия ключа. "
                f"Пока коротко: {base_reply}"
            )
        return base_reply


async def process_user_message(db: Session, user_id: str, message: str, channel: str = "web") -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, display_name="Гость")
        db.add(user)
        db.commit()

    user_msg = ChatMessage(user_id=user_id, channel=channel, role="user", content=message)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    risk_flags = detect_risk(message)
    if any(risk_flags.values()):
        emotional = {
            "tiredness_score": 0,
            "anxiety_score": 0,
            "deadline_pressure": 0,
            "study_readiness": 0,
            "overload_score": 0,
            "procrastination_probability": 0,
            "detected_intent": "risk",
            "risk_flags": risk_flags,
            "short_reason": "обнаружены признаки риска",
        }
        mode = choose_recommended_mode(emotional)
        reply = SAFETY_RESPONSE
        actions = []
    else:
        emotional = analyze_tiredness(message)
        mode = choose_recommended_mode(emotional)
        base_reply = soften_output(_reply_for(mode, emotional))
        reply = await _maybe_llm_reply(db=db, user_id=user_id, message=message, mode=mode, emotional=emotional, base_reply=base_reply)
        actions = SUGGESTED_RITUALS if mode in {"recovery", "anti_guilt", "anxiety_eater"} else [{"type": "focus", "id": "tiny_focus_round", "title": "10 минут против часовых"}]

    db.add(EmotionalState(
        user_id=user_id,
        message_id=user_msg.id,
        tiredness_score=emotional["tiredness_score"],
        anxiety_score=emotional["anxiety_score"],
        deadline_pressure=emotional["deadline_pressure"],
        study_readiness=emotional["study_readiness"],
        overload_score=emotional["overload_score"],
        procrastination_probability=emotional["procrastination_probability"],
        detected_intent=emotional["detected_intent"],
        short_reason=emotional["short_reason"],
    ))
    state = db.query(UserStudyState).filter(UserStudyState.user_id == user_id).first()
    if state:
        state.last_recommended_mode = mode
    assistant_msg = ChatMessage(user_id=user_id, channel=channel, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()
    return {"reply": reply, "emotional_state": emotional, "recommended_mode": mode, "suggested_actions": actions}
