from fastapi import APIRouter
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health():
    settings = get_settings()
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "llm": {
            "mode": settings.llm_mode,
            "model": settings.llm_model_name,
            "base_url": settings.llm_base_url,
            "configured": settings.llm_mode == "mock" or bool(settings.llm_model_name),
            "has_api_key": bool(settings.llm_api_key),
        },
    }
