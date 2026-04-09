from fastapi import APIRouter
from app.wiki_client import wiki_client
from app.schemas import SiteStats

router = APIRouter(prefix="/site", tags=["Site"])


@router.get("/stats", response_model=SiteStats, summary="Get wiki statistics")
async def get_site_stats():
    data = await wiki_client.action_query(meta="siteinfo", siprop="statistics")
    return data["statistics"]
