from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas import ChatRequest, ChatResponse
from app.services.coaching_engine import process_user_message

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
async def chat_message(payload: ChatRequest, db: Session = Depends(get_db)):
    return await process_user_message(db, payload.user_id, payload.message, payload.channel)

