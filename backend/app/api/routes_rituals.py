from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas import AnxietyRequest, RitualCompleteRequest, RitualStartRequest, TaskBurnerRequest
from app.services.ritual_service import burn_task, complete_ritual, rewrite_anxiety, start_ritual

router = APIRouter(prefix="/api/rituals", tags=["rituals"])


@router.post("/start")
def start(payload: RitualStartRequest, db: Session = Depends(get_db)):
    return start_ritual(db, payload.user_id, payload.ritual_type)


@router.post("/complete")
def complete(payload: RitualCompleteRequest, db: Session = Depends(get_db)):
    try:
        return complete_ritual(db, payload.user_id, payload.ritual_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/anxiety-eater")
async def anxiety(payload: AnxietyRequest):
    rewritten = await rewrite_anxiety(payload.anxiety_text)
    return {
        "original_text": payload.anxiety_text,
        "rewritten_text": rewritten,
        "message": "Готово. Тревожная мысль стала спокойнее и конкретнее.",
    }


@router.post("/task-burner")
async def task_burner(payload: TaskBurnerRequest, db: Session = Depends(get_db)):
    return await burn_task(db, payload.user_id, payload.scary_task)
