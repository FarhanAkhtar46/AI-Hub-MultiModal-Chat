import asyncio
from typing import List

from fastapi import APIRouter, Depends

from ..services.auth import verify_api_key
from ..services.providers import (
    AnthropicProvider,
    GoogleProvider,
    MistralProvider,
    OpenAIProvider,
    PerplexityProvider,
)
from ..schemas import ChatRequest, ChatResponse, ModelResponse


router = APIRouter(tags=["chat"])


PROVIDER_MAP = {
    "openai": OpenAIProvider(),
    "anthropic": AnthropicProvider(),
    "google": GoogleProvider(),
    "mistral": MistralProvider(),
    "perplexity": PerplexityProvider(),
}


async def call_single_model(provider_key: str, req: ChatRequest) -> ModelResponse:
    provider = PROVIDER_MAP.get(provider_key)
    if provider is None:
        return ModelResponse(
            model=provider_key, output="", latency_ms=0, error="Unknown provider"
        )

    try:
        return await provider.generate(
            prompt=req.prompt,
            system=req.system_prompt,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )
    except Exception as exc:  # noqa: BLE001
        return ModelResponse(
            model=provider_key,
            output="",
            latency_ms=0,
            error=str(exc),
        )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    _: None = Depends(verify_api_key),
) -> ChatResponse:
    tasks = [call_single_model(model_key, payload) for model_key in payload.models]
    results = await asyncio.gather(*tasks)
    return ChatResponse(responses=results)


