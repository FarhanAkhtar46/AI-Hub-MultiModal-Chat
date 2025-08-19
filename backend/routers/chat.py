import asyncio
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..services.auth import verify_api_key
from ..services.providers import (
    AnthropicProvider,
    GoogleProvider,
    MistralProvider,
    OpenAIProvider,
    PerplexityProvider,
)
from ..services.storage import chat_storage
from ..schemas import (
    ChatRequest, ChatResponse, ModelResponse, ChatSession, CreateSessionRequest,
    AddMessageRequest, GetSessionResponse, ListSessionsResponse, ChatMessage
)

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

@router.post("/sessions", response_model=ChatSession)
async def create_session(
    payload: CreateSessionRequest,
    _: None = Depends(verify_api_key),
) -> ChatSession:
    return chat_storage.create_session(payload.title)

@router.get("/sessions", response_model=ListSessionsResponse)
async def list_sessions(
    _: None = Depends(verify_api_key),
) -> ListSessionsResponse:
    sessions = chat_storage.list_sessions()
    return ListSessionsResponse(sessions=sessions)

@router.get("/sessions/{session_id}", response_model=GetSessionResponse)
async def get_session(
    session_id: str,
    _: None = Depends(verify_api_key),
) -> GetSessionResponse:
    session = chat_storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return GetSessionResponse(session=session)

@router.post("/sessions/{session_id}/messages", response_model=ChatResponse)
async def add_message(
    session_id: str,
    payload: AddMessageRequest,
    _: None = Depends(verify_api_key),
) -> ChatResponse:
    # Verify session exists
    session = chat_storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add user message
    user_message = ChatMessage(
        role="user",
        content=payload.content,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    chat_storage.add_message(session_id, user_message)
    
    # Build context from previous messages
    context_messages = []
    for msg in session.messages[-5:]:  # Last 5 messages for context
        if msg.role == "user":
            context_messages.append(f"User: {msg.content}")
        # Don't include assistant responses in context to avoid duplication
    
    # Create enhanced prompt with context
    enhanced_prompt = payload.content
    if context_messages:
        context_text = "\n\n".join(context_messages)
        enhanced_prompt = f"Previous conversation:\n{context_text}\n\nCurrent question: {payload.content}"
    
    # Call models with enhanced prompt
    tasks = [call_single_model(model_key, ChatRequest(
        prompt=enhanced_prompt,
        models=[model_key],
        system_prompt=payload.system_prompt,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens
    )) for model_key in payload.models]
    
    results = await asyncio.gather(*tasks)
    
    # Add assistant message with responses
    assistant_message = ChatMessage(
        role="assistant",
        content=enhanced_prompt,
        timestamp=datetime.now(timezone.utc).isoformat(),
        model_responses=results
    )
    chat_storage.add_message(session_id, assistant_message)
    
    return ChatResponse(responses=results)

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    _: None = Depends(verify_api_key),
) -> dict:
    success = chat_storage.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}


