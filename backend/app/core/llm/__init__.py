from app.config import get_settings
from app.core.llm.api_client import ApiLLMClient
from app.core.llm.local_client import LocalLLMClient
from app.core.llm.mock_client import MockLLMClient


def get_llm_client():
    mode = get_settings().llm_mode.lower()
    if mode == "api":
        return ApiLLMClient()
    if mode == "local":
        return LocalLLMClient()
    return MockLLMClient()

