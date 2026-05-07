import json
from app.core.llm.base import LLMClient


class MockLLMClient(LLMClient):
    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        lowered = user_prompt.lower()
        if "катастроф" in lowered or "трев" in lowered or "завал" in lowered:
            return "Сейчас не нужно спасать весь семестр. Достаточно выбрать один маленький кусочек и дать ему 10 минут."
        if "микро" in lowered or "страш" in lowered:
            return "1. Открыть место, где живёт задача.\n2. Написать один черновой заголовок.\n3. Выписать первую смешно-кривую мысль."
        return "Похоже, мозгу нужен мягкий режим. Сначала зарядка для себя, потом один маленький учебный шаг без героизма."

    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> dict:
        return {
            "task_title": "10 минут против часовых",
            "task_text": "Открой свои материалы по теме и выпиши 3 вопроса. Отвечать на них не надо, просто поймай.",
            "duration_minutes": 10,
            "success_condition": "Пользователь выписал хотя бы 1-3 вопроса.",
        }

