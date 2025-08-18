import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx
from ..schemas import ModelResponse


@dataclass
class ProviderConfig:
    api_key_env: str
    base_url_env: Optional[str] = None
    default_model_env: Optional[str] = None


class BaseProvider:
    name: str
    config: ProviderConfig

    def __init__(self, name: str, config: ProviderConfig) -> None:
        self.name = name
        self.config = config

    def _auth_header(self) -> Dict[str, str]:
        api_key = os.getenv(self.config.api_key_env)
        if not api_key:
            return {}
        # Customize per provider in subclasses if needed
        return {"Authorization": f"Bearer {api_key}"}

    def _base_url(self) -> Optional[str]:
        return os.getenv(self.config.base_url_env) if self.config.base_url_env else None

    def _default_model(self) -> Optional[str]:
        return os.getenv(self.config.default_model_env) if self.config.default_model_env else None

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> ModelResponse:
        raise NotImplementedError


class OpenAIProvider(BaseProvider):
    def __init__(self) -> None:
        super().__init__(
            name="openai",
            config=ProviderConfig(
                api_key_env="OPENAI_API_KEY",
                base_url_env="OPENAI_BASE_URL",  # optional, use default if not set
                default_model_env="OPENAI_MODEL",  # e.g., gpt-4o-mini
            ),
        )

    async def generate(self, prompt: str, system: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> ModelResponse:
        model = self._default_model() or "gpt-4o-mini"
        url = (self._base_url() or "https://api.openai.com/v1") + "/chat/completions"
        headers = {"Content-Type": "application/json", **self._auth_header()}
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
        }
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            elapsed = int((time.perf_counter() - started) * 1000)
        if resp.status_code >= 400:
            return ModelResponse(model=self.name, output="", latency_ms=elapsed, error=resp.text)
        data = resp.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        finish_reason = data.get("choices", [{}])[0].get("finish_reason")
        usage = data.get("usage")
        return ModelResponse(model=self.name, output=text, latency_ms=elapsed, finish_reason=finish_reason, usage=usage)


class AnthropicProvider(BaseProvider):
    def __init__(self) -> None:
        super().__init__(
            name="anthropic",
            config=ProviderConfig(
                api_key_env="ANTHROPIC_API_KEY",
                base_url_env="ANTHROPIC_BASE_URL",
                default_model_env="ANTHROPIC_MODEL",  # e.g., claude-3-5-sonnet-latest
            ),
        )

    def _auth_header(self) -> Dict[str, str]:
        api_key = os.getenv(self.config.api_key_env)
        return {"x-api-key": api_key} if api_key else {}

    async def generate(self, prompt: str, system: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> ModelResponse:
        model = self._default_model() or "claude-3-5-sonnet-latest"
        url = (self._base_url() or "https://api.anthropic.com") + "/v1/messages"
        headers = {"Content-Type": "application/json", "anthropic-version": "2023-06-01", **self._auth_header()}
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload: Dict[str, Any] = {"model": model, "max_tokens": max_tokens or 512, "messages": messages}
        if temperature is not None:
            payload["temperature"] = temperature

        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            elapsed = int((time.perf_counter() - started) * 1000)
        if resp.status_code >= 400:
            return ModelResponse(model=self.name, output="", latency_ms=elapsed, error=resp.text)
        data = resp.json()
        # Anthropic returns content as list of blocks
        content_blocks = data.get("content", [])
        text = "".join(block.get("text", "") for block in content_blocks if block.get("type") == "text")
        return ModelResponse(model=self.name, output=text, latency_ms=elapsed, finish_reason=data.get("stop_reason"), usage=data.get("usage"))


class GoogleProvider(BaseProvider):
    def __init__(self) -> None:
        super().__init__(
            name="google",
            config=ProviderConfig(
                api_key_env="GOOGLE_API_KEY",
                base_url_env="GOOGLE_BASE_URL",
                default_model_env="GOOGLE_MODEL",  # e.g., gemini-1.5-pro
            ),
        )

    async def generate(self, prompt: str, system: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> ModelResponse:
        model = self._default_model() or "gemini-1.5-pro"
        base = self._base_url() or "https://generativelanguage.googleapis.com"
        url = f"{base}/v1beta/models/{model}:generateContent?key={os.getenv('GOOGLE_API_KEY','')}"
        headers = {"Content-Type": "application/json"}
        parts = []
        if system:
            parts.append({"text": system})
        parts.append({"text": prompt})
        payload: Dict[str, Any] = {"contents": [{"role": "user", "parts": parts}]}
        if temperature is not None:
            payload["generationConfig"] = {"temperature": temperature, **({"maxOutputTokens": max_tokens} if max_tokens else {})}

        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            elapsed = int((time.perf_counter() - started) * 1000)
        if resp.status_code >= 400:
            return ModelResponse(model=self.name, output="", latency_ms=elapsed, error=resp.text)
        data = resp.json()
        candidates = data.get("candidates", [])
        text = ""
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            text = "".join(p.get("text", "") for p in parts)
        return ModelResponse(model=self.name, output=text, latency_ms=elapsed, finish_reason=None, usage=data.get("usageMetadata"))


class MistralProvider(BaseProvider):
    def __init__(self) -> None:
        super().__init__(
            name="mistral",
            config=ProviderConfig(
                api_key_env="MISTRAL_API_KEY",
                base_url_env="MISTRAL_BASE_URL",
                default_model_env="MISTRAL_MODEL",  # e.g., mistral-large-latest
            ),
        )

    async def generate(self, prompt: str, system: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> ModelResponse:
        model = self._default_model() or "mistral-large-latest"
        url = (self._base_url() or "https://api.mistral.ai") + "/v1/chat/completions"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {os.getenv('MISTRAL_API_KEY','')}"}
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload: Dict[str, Any] = {"model": model, "messages": messages}
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            elapsed = int((time.perf_counter() - started) * 1000)
        if resp.status_code >= 400:
            return ModelResponse(model=self.name, output="", latency_ms=elapsed, error=resp.text)
        data = resp.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        finish_reason = data.get("choices", [{}])[0].get("finish_reason")
        usage = data.get("usage")
        return ModelResponse(model=self.name, output=text, latency_ms=elapsed, finish_reason=finish_reason, usage=usage)


class PerplexityProvider(BaseProvider):
    def __init__(self) -> None:
        super().__init__(
            name="perplexity",
            config=ProviderConfig(
                api_key_env="PERPLEXITY_API_KEY",
                base_url_env="PERPLEXITY_BASE_URL",
                default_model_env="PERPLEXITY_MODEL",  # e.g., llama-3.1-sonar-large-128k-online
            ),
        )

    async def generate(self, prompt: str, system: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> ModelResponse:
        model = self._default_model() or "llama-3.1-sonar-large-128k-online"
        url = (self._base_url() or "https://api.perplexity.ai") + "/chat/completions"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY','')}"}
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload: Dict[str, Any] = {"model": model, "messages": messages}
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            elapsed = int((time.perf_counter() - started) * 1000)
        if resp.status_code >= 400:
            return ModelResponse(model=self.name, output="", latency_ms=elapsed, error=resp.text)
        data = resp.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        finish_reason = data.get("choices", [{}])[0].get("finish_reason")
        usage = data.get("usage")
        return ModelResponse(model=self.name, output=text, latency_ms=elapsed, finish_reason=finish_reason, usage=usage)


