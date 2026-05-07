import asyncio
import json
import os
import urllib.error
import urllib.request

import httpx

from app.config import get_settings
from app.core.llm.base import LLMClient


class ApiLLMClient(LLMClient):
    def __init__(self):
        self.settings = get_settings()

    async def _chat(self, system_prompt: str, user_prompt: str, temperature: float) -> str:
        if not self.settings.llm_model_name:
            raise RuntimeError("LLM_MODEL_NAME is required when LLM_MODE=api or LLM_MODE=local")

        base_url = self.settings.llm_base_url or "https://api.openai.com/v1"
        if not self.settings.llm_api_key and "api.openai.com" in base_url:
            raise RuntimeError("LLM_API_KEY is required for OpenAI API calls")

        headers = {"Content-Type": "application/json"}
        if self.settings.llm_api_key:
            headers["Authorization"] = f"Bearer {self.settings.llm_api_key}"

        payload = {
            "model": self.settings.llm_model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }
        url = f"{base_url.rstrip('/')}/chat/completions"

        # Primary path: httpx (async).
        try:
            # Some environments inject HTTP(S)_PROXY to a local proxy that blocks external requests.
            # Clear them explicitly for this outbound call.
            for k in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
                os.environ.pop(k, None)

            transport = httpx.AsyncHTTPTransport(trust_env=False, proxy=None, retries=0)
            async with httpx.AsyncClient(timeout=30, trust_env=False, proxy=None, transport=transport) as client:
                response = await client.post(url, json=payload, headers=headers)
                return self._extract_content(response)
        except httpx.ProxyError:
            # Fallback path: urllib with proxies disabled.
            # This is more robust on some macOS setups where proxy env vars are injected.
            def _urllib_call() -> str:
                req = urllib.request.Request(
                    url=url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST",
                )
                opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
                try:
                    with opener.open(req, timeout=30) as resp:
                        raw = resp.read().decode("utf-8")
                except urllib.error.HTTPError as e:
                    raw = e.read().decode("utf-8", errors="replace")
                    raise RuntimeError(f"LLM HTTP error {e.code}: {raw}") from e
                data = json.loads(raw)
                return self._extract_content_from_json(data)

            return await asyncio.to_thread(_urllib_call)

    def _extract_content(self, response: httpx.Response) -> str:
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            body = e.response.text[:1200]
            raise RuntimeError(f"LLM HTTP error {e.response.status_code}: {body}") from e
        return self._extract_content_from_json(response.json())

    @staticmethod
    def _extract_content_from_json(data: dict) -> str:
        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError(f"LLM response has no choices: {data}")

        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    parts.append(item.get("text", ""))
                elif isinstance(item, str):
                    parts.append(item)
            content = "".join(parts)

        if not isinstance(content, str) or not content.strip():
            raise RuntimeError(f"LLM response has empty message content: {data}")
        return content

    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        return await self._chat(system_prompt, user_prompt, temperature)

    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> dict:
        text = await self._chat(system_prompt, user_prompt, temperature)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start == -1 or end == -1 or end <= start:
                raise
            return json.loads(text[start:end + 1])
