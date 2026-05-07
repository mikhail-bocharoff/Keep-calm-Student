from abc import ABC, abstractmethod


class LLMClient(ABC):
    @abstractmethod
    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        raise NotImplementedError

    @abstractmethod
    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> dict:
        raise NotImplementedError

