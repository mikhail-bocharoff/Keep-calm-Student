from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas import FocusCompleteRequest, FocusStartRequest
from app.services.focus_round_service import complete_focus_round, start_focus_round

router = APIRouter(prefix="/api/focus", tags=["focus"])


@router.post("/start")
async def start(payload: FocusStartRequest, db: Session = Depends(get_db)):
    return await start_focus_round(db, payload.user_id)


@router.post("/complete")
def complete(payload: FocusCompleteRequest, db: Session = Depends(get_db)):
    try:
        return complete_focus_round(db, payload.user_id, payload.focus_round_id, payload.user_result)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
