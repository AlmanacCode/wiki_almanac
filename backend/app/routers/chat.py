from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.chat.session_store import create_session, get_session, save_session, list_sessions
from app.chat.agent import stream_chat

router = APIRouter(prefix="/chat", tags=["Chat (Quill)"])


class ChatRequest(BaseModel):
    prompt: str
    article_title: str | None = None


class SessionInfo(BaseModel):
    session_id: str
    article_title: str | None
    message_count: int


@router.post("/sessions", response_model=SessionInfo, summary="Create a new chat session")
async def create_chat_session(article_title: str | None = None):
    session = create_session(article_title=article_title)
    return SessionInfo(
        session_id=session.session_id,
        article_title=session.article_title,
        message_count=0,
    )


@router.get("/sessions", response_model=list[SessionInfo], summary="List active sessions")
async def get_sessions():
    return [
        SessionInfo(
            session_id=s.session_id,
            article_title=s.article_title,
            message_count=len(s.messages),
        )
        for s in list_sessions()
    ]


@router.get("/sessions/{session_id}", summary="Get session details with messages")
async def get_session_detail(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session.session_id,
        "article_title": session.article_title,
        "messages": [
            {"role": m["role"], "content": m["content"] if isinstance(m["content"], str) else "[tool interaction]"}
            for m in session.messages
        ],
    }


@router.post("/sessions/{session_id}/stream", summary="Send a message and stream the response (SSE)")
async def stream_chat_message(session_id: str, req: ChatRequest):
    session = get_session(session_id)
    if not session:
        # Auto-create session if it doesn't exist
        session = create_session(article_title=req.article_title)
        session.session_id = session_id  # Use the provided ID

    if req.article_title and not session.article_title:
        session.article_title = req.article_title

    async def event_generator():
        async for event in stream_chat(session, req.prompt):
            yield event
        save_session(session)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
