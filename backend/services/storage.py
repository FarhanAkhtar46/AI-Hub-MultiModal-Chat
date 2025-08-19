import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from ..schemas import ChatMessage, ChatSession


class ChatStorage:
    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {}

    def create_session(self, title: str) -> ChatSession:
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        session = ChatSession(
            id=session_id,
            title=title,
            messages=[],
            created_at=now,
            updated_at=now
        )
        
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        return self.sessions.get(session_id)

    def list_sessions(self) -> List[ChatSession]:
        return list(self.sessions.values())

    def add_message(self, session_id: str, message: ChatMessage) -> Optional[ChatSession]:
        session = self.sessions.get(session_id)
        if not session:
            return None
        
        session.messages.append(message)
        session.updated_at = datetime.now(timezone.utc).isoformat()
        return session

    def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    def update_session_title(self, session_id: str, title: str) -> Optional[ChatSession]:
        session = self.sessions.get(session_id)
        if not session:
            return None
        
        session.title = title
        session.updated_at = datetime.now(timezone.utc).isoformat()
        return session


# Global instance
chat_storage = ChatStorage()
