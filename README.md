## AI Hub – Multi‑LLM Comparison (Frontend + FastAPI Backend)

### Overview
**AI Hub** lets you send a single prompt to multiple LLMs and compare their answers side‑by‑side in real time. The backend fans out the request to selected providers in parallel, aggregates responses with latency and usage metadata, and returns them to a polished React UI.

### Key features
- **Parallel prompt routing** to multiple providers
- **Response aggregation** with latency and metadata
- **Simple API key auth** via `X-API-Key`
- **Extensible provider adapters** (OpenAI, Anthropic, Google/Gemini, Mistral, Perplexity)
- **Modern UI** with model selection and comparison cards

### Architecture
- **Frontend**: Vite, React, TypeScript, Tailwind, shadcn‑ui
- **Backend**: Python, FastAPI, Uvicorn, httpx
- **Dev Proxy**: Vite proxies `/api/*` → `http://localhost:8000`

---

## Quickstart

### 1) Backend (Python 3.10+)
```bash
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy env.example .env  # create and fill keys (macOS/Linux: cp env.example .env)
uvicorn backend.main:app --reload --port 8000
```

### 2) Frontend
```bash
npm install
npm run dev
```

The UI will be available on `http://localhost:8080` and will proxy API requests to the backend.

---

## Environment configuration

### Backend `.env`
- `API_KEY` (optional for local dev). If set, clients must send `X-API-Key`.
- Provider keys and optional overrides:
  - `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
  - `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_BASE_URL`
  - `GOOGLE_API_KEY`, `GOOGLE_MODEL`, `GOOGLE_BASE_URL`
  - `MISTRAL_API_KEY`, `MISTRAL_MODEL`, `MISTRAL_BASE_URL`
  - `PERPLEXITY_API_KEY`, `PERPLEXITY_MODEL`, `PERPLEXITY_BASE_URL`

### Frontend `.env`
- `VITE_API_KEY` (optional) — set to match backend `API_KEY` if auth is enabled.

Restart both servers after editing any `.env`.

---

## API

### POST `/api/chat`
Send one prompt to multiple providers and receive aggregated responses.

Request body
```json
{
  "prompt": "Explain transformers simply.",
  "models": ["openai", "anthropic", "google", "mistral", "perplexity"],
  "system_prompt": "You are helpful.",
  "temperature": 0.7,
  "max_tokens": 256
}
```

Response body
```json
{
  "responses": [
    {
      "model": "openai",
      "output": "...",
      "latency_ms": 1234,
      "finish_reason": "stop",
      "usage": { "prompt_tokens": 12, "completion_tokens": 34 }
    }
  ]
}
```

Auth (optional): add header `X-API-Key: <yourkey>` if backend `API_KEY` is set.

---

## Development notes
- Vite dev proxy is configured in `vite.config.ts` to forward `/api/*` → `http://localhost:8000`.
- Start the backend with:
  - `uvicorn backend.main:app --reload --port 8000`
  - or `npm run backend:dev` (see `package.json`).

### Troubleshooting
- 401 Unauthorized: ensure frontend sends `X-API-Key` and that it matches backend `API_KEY`.
- Update `.env`, then restart both frontend and backend.

---

## Tech stack
- Frontend: Vite, React, TypeScript, Tailwind CSS, shadcn‑ui
- Backend: FastAPI, Uvicorn, httpx
- Providers: OpenAI, Anthropic, Google (Gemini), Mistral, Perplexity

---

## Roadmap
- Streaming responses
- Persistent chat sessions/history
- Domain/policy‑based routing strategies
- Quality scoring and ranking
- Export and share comparisons

---

## License
MIT (or update to your preferred license)
