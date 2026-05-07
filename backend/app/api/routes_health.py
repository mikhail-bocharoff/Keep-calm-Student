from fastapi import APIRouter
from app.config import get_settings
from app.core.llm import get_llm_client

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


@router.get("/health/llm")
async def llm_health():
    settings = get_settings()
    status = {
        "mode": settings.llm_mode,
        "model": settings.llm_model_name,
        "base_url": settings.llm_base_url,
        "has_api_key": bool(settings.llm_api_key),
    }
    try:
        text = await get_llm_client().generate_text(
            system_prompt="Ответь одной короткой русской фразой.",
            user_prompt="Проверка связи. Напиши: нейросеть отвечает.",
            temperature=0.1,
        )
        return {"status": "ok", "llm": status, "sample": text}
    except Exception as exc:
        return {
            "status": "error",
            "llm": status,
            "error_type": type(exc).__name__,
            "error": str(exc)[:1200],
        }
