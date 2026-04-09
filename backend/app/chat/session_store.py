"""In-memory session storage. Replace with Redis for production."""

from dataclasses import dataclass, field
import uuid


@dataclass
class ChatSession:
    session_id: str
    article_title: str | None = None
    messages: list[dict] = field(default_factory=list)


_sessions: dict[str, ChatSession] = {}


def create_session(article_title: str | None = None) -> ChatSession:
    sid = str(uuid.uuid4())
    session = ChatSession(session_id=sid, article_title=article_title)
    _sessions[sid] = session
    return session


def get_session(session_id: str) -> ChatSession | None:
    return _sessions.get(session_id)


def save_session(session: ChatSession) -> None:
    _sessions[session.session_id] = session


def list_sessions() -> list[ChatSession]:
    return list(_sessions.values())
