from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import chat
from . import config  # noqa: F401  # ensures dotenv is loaded on startup


app = FastAPI(title="AI Hub Backend")

# Allow local dev UIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(chat.router, prefix="/api")


