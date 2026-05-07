import pytest

from app.core.llm.api_client import ApiLLMClient


def test_extracts_plain_chat_completion_content():
    data = {"choices": [{"message": {"content": "Мягкий ответ от модели"}}]}

    assert ApiLLMClient._extract_content_from_json(data) == "Мягкий ответ от модели"


def test_extracts_text_part_chat_completion_content():
    data = {
        "choices": [
            {
                "message": {
                    "content": [
                        {"type": "text", "text": "Первый кусок. "},
                        {"type": "text", "text": "Второй кусок."},
                    ]
                }
            }
        ]
    }

    assert ApiLLMClient._extract_content_from_json(data) == "Первый кусок. Второй кусок."


def test_rejects_empty_llm_response():
    with pytest.raises(RuntimeError):
        ApiLLMClient._extract_content_from_json({"choices": []})
