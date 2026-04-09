"""Placeholder router for AI-powered endpoints.

This is where your existing Python AI layer integrates.
Endpoints here can call wiki_client to read articles,
then run AI processing on top.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/health", summary="AI layer health check")
async def ai_health():
    return {"status": "ok", "message": "AI endpoints ready for integration"}


# TODO: Add your AI endpoints here, e.g.:
#
# @router.post("/summarize")
# async def summarize_article(title: str):
#     page = await wiki_client.action_parse(page=title, prop="text")
#     summary = your_ai_model.summarize(page["text"])
#     return {"title": title, "summary": summary}
#
# @router.post("/suggest-edits")
# async def suggest_edits(title: str):
#     ...
#
# @router.post("/semantic-search")
# async def semantic_search(query: str):
#     ...
