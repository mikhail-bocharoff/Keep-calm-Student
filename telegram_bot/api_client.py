import httpx
from config import settings


async def create_user(display_name: str, telegram_id: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
      response = await client.post(f"{settings.backend_url}/api/users", json={"display_name": display_name, "telegram_id": telegram_id})
      response.raise_for_status()
      return response.json()


async def send_chat(user_id: str, message: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(f"{settings.backend_url}/api/chat/message", json={"user_id": user_id, "channel": "telegram", "message": message})
        response.raise_for_status()
        return response.json()


async def start_ritual(user_id: str, ritual_type: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(f"{settings.backend_url}/api/rituals/start", json={"user_id": user_id, "ritual_type": ritual_type})
        response.raise_for_status()
        return response.json()


async def start_focus(user_id: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(f"{settings.backend_url}/api/focus/start", json={"user_id": user_id})
        response.raise_for_status()
        return response.json()


async def get_progress(user_id: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f"{settings.backend_url}/api/progress/{user_id}")
        response.raise_for_status()
        return response.json()


async def reset_user(user_id: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(f"{settings.backend_url}/api/users/{user_id}/reset")
        response.raise_for_status()
        return response.json()
