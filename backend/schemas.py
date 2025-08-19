from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    models: List[str] = Field(..., min_items=1)
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1)


class ModelResponse(BaseModel):
    model: str
    output: str
    latency_ms: int
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ChatResponse(BaseModel):
    responses: List[ModelResponse]


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str
    model_responses: Optional[List[ModelResponse]] = None  # for assistant messages


class ChatSession(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]
    created_at: str
    updated_at: str


class CreateSessionRequest(BaseModel):
    title: str


class AddMessageRequest(BaseModel):
    session_id: str
    content: str
    models: List[str]
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1)


class GetSessionResponse(BaseModel):
    session: ChatSession


class ListSessionsResponse(BaseModel):
    sessions: List[ChatSession]


