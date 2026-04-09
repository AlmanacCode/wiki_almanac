from fastapi import APIRouter, Query
from app.wiki_client import wiki_client
from app.schemas import SearchResult, SearchResponse

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/", response_model=SearchResponse, summary="Search articles")
async def search_pages(q: str = Query(..., min_length=1), limit: int = Query(10, le=50)):
    data = await wiki_client.rest_get("search/page", q=q, limit=limit)
    results = [
        SearchResult(
            id=p["id"],
            key=p["key"],
            title=p["title"],
            excerpt=p.get("excerpt"),
            description=p.get("description"),
        )
        for p in data.get("pages", [])
    ]
    return SearchResponse(query=q, results=results)
