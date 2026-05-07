import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.llm import get_llm_client
from app.core.safety.output_filter import soften_output
from app.db.models import Ritual, TaskBox
from app.services.gamification_service import reward_ritual
from app.services.topic_service import get_state


RITUAL_MESSAGES = {
    "cat_mode": ("Включаю Кошачий режим. Учёбу временно убираем под плед. Твоя задача - 15 минут ничего не доказывать миру.", 15),
    "anxiety_eater": ("Пожиратель тревоги готов. Напиши мысль, которая раздулась до размеров финального босса.", 5),
    "task_burner": ("Сжигатель списка задач ждёт страшную задачу. Мы превратим её в три крошечных шага.", 5),
}


def start_ritual(db: Session, user_id: str, ritual_type: str) -> dict:
    message, minutes = RITUAL_MESSAGES[ritual_type]
    ritual = Ritual(user_id=user_id, ritual_type=ritual_type, duration_minutes=minutes)
    db.add(ritual)
    db.commit()
    db.refresh(ritual)
    return {"ritual_id": ritual.id, "ritual_type": ritual.ritual_type, "duration_minutes": minutes, "message": message}


def complete_ritual(db: Session, user_id: str, ritual_id: str) -> dict:
    ritual = db.query(Ritual).filter(Ritual.id == ritual_id, Ritual.user_id == user_id).first()
    if not ritual:
        raise ValueError("Ritual not found")
    if ritual.status != "completed":
        ritual.status = "completed"
        ritual.completed_at = datetime.utcnow()
        db.commit()
        progress = reward_ritual(db, user_id)
    else:
        from app.services.gamification_service import get_or_create_progress, progress_payload
        progress = progress_payload(get_or_create_progress(db, user_id))
    return {
        "message": "Ритуал завершён. Мозг не обязан стать супергероем, но теперь можно попробовать один маленький шаг.",
        "progress": progress,
    }


async def rewrite_anxiety(anxiety_text: str) -> str:
    fallback = (
        "Сейчас тревога просит решить всё сразу. Переводим мягче: на ближайшие две минуты нужна не победа, а один видимый след. "
        "Открой задание и выпиши один вопрос, который можно задать по теме. Этого уже достаточно для старта."
    )
    try:
        text = await get_llm_client().generate_text(
            system_prompt=(
                "Ты бережный коуч FocusFloat. Перепиши тревожную мысль студента на живом русском.\n"
                "Стиль: коротко, спокойно, без канцелярита, без слов 'контроль', 'продуктивность', 'эффективность'.\n"
                "Не предлагай большой план. Дай максимум 2 действия по 30-90 секунд.\n"
                "Ответ до 4 коротких предложений. Обращайся на 'ты'."
            ),
            user_prompt=f"Тревожная мысль:\n{anxiety_text}\n\nПерепиши её мягко и конкретно.",
            temperature=0.35,
        )
        rewritten = soften_output(text.strip())
        if not _anxiety_rewrite_is_clean(rewritten):
            return fallback
        return rewritten or fallback
    except Exception:
        return fallback


def _anxiety_rewrite_is_clean(text: str) -> bool:
    lowered = text.lower()
    awkward_markers = [
        "ты боюсь",
        "ты сейчас чувствуешь себя",
        "составь список",
        "прямо сейчас",
        "контроль",
        "продуктив",
    ]
    return 40 <= len(text) <= 520 and not any(marker in lowered for marker in awkward_markers)


def _fallback_micro_steps(scary_task: str, topic: str | None = None) -> list[str]:
    if topic:
        return [
            f"Открой материал по теме «{topic}» и просто посмотри на первый заголовок.",
            "Выпиши один термин или вопрос, который бросился в глаза.",
            "Напиши одну кривую фразу о том, что нужно сделать дальше.",
        ]
    if "семинар" in scary_task.lower():
        return [
            "Открой чат, конспект или файл, где лежит задание к семинару.",
            "Выпиши один вопрос, который можно задать преподавателю.",
            "Найди один абзац или слайд, который выглядит самым понятным.",
        ]
    return [
        "Открой место, где лежит задача, и ничего не исправляй.",
        "Напиши одну фразу: что должно получиться в самом конце.",
        "Сделай первый черновой кусок на 30 секунд и остановись.",
    ]


def _steps_are_tiny(steps: list[str]) -> bool:
    broad_markers = [
        "все необходимые",
        "составь план подготовки",
        "изучи теорию",
        "повтори ключевые",
        "собери все",
        "проанализируй",
    ]
    return (
        len(steps) == 3
        and all(12 <= len(step) <= 110 for step in steps)
        and not any(marker in step.lower() for marker in broad_markers for step in steps)
    )


async def burn_task(db: Session, user_id: str, scary_task: str) -> dict:
    state = get_state(db, user_id)
    micro_steps = _fallback_micro_steps(scary_task, state.current_topic if state else None)
    try:
        data = await get_llm_client().generate_json(
            system_prompt=(
                "Ты FocusFloat. Разбей страшную учебную задачу на 3 микрошага по 30-90 секунд.\n"
                "Это должны быть физически маленькие действия: открыть файл, найти строку, выписать вопрос, написать одну фразу.\n"
                "Не используй широкие шаги вроде 'собери материалы', 'изучи тему', 'составь план подготовки'.\n"
                "Пиши на естественном русском, без шуток ради шуток. Каждый шаг до 90 символов и начинается с глагола.\n"
                "Верни строго JSON: {\"micro_steps\": [\"...\", \"...\", \"...\"], \"message\": \"...\"}."
            ),
            user_prompt=(
                f"Страшная задача: {scary_task}\n"
                f"Тема: {state.current_topic if state else ''}\n"
                f"Текущая учебная задача: {state.current_task if state else ''}\n"
                f"Дедлайн: {state.deadline_text if state else ''}\n"
            ),
            temperature=0.35,
        )
        llm_steps = data.get("micro_steps")
        if isinstance(llm_steps, list) and len(llm_steps) >= 3:
            proposed = [soften_output(str(step).strip()) for step in llm_steps[:3] if str(step).strip()]
            if _steps_are_tiny(proposed):
                micro_steps = proposed
    except Exception:
        data = {}

    box = TaskBox(user_id=user_id, scary_task=scary_task, micro_steps_json=json.dumps(micro_steps, ensure_ascii=False), locked_until_readiness=5)
    db.add(box)
    db.commit()
    db.refresh(box)
    message = soften_output(data.get("message", "")) if isinstance(data, dict) else ""
    return {
        "task_box_id": box.id,
        "scary_task": scary_task,
        "micro_steps": micro_steps,
        "locked_until_readiness": 5,
        "message": message or "Я убрал лишний шум вокруг задачи. Теперь перед тобой три маленьких шага, а не один огромный ком.",
    }
