from fastapi import APIRouter, Query
from app.wiki_client import wiki_client
from app.schemas import Category, CategoryMember

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=list[Category], summary="List all categories")
async def list_categories(limit: int = Query(50, le=500)):
    data = await wiki_client.action_query(list="allcategories", aclimit=str(limit))
    return data.get("allcategories", [])


@router.get("/{name}/members", response_model=list[CategoryMember], summary="List pages in a category")
async def get_category_members(name: str, limit: int = Query(50, le=500)):
    data = await wiki_client.action_query(
        list="categorymembers",
        cmtitle=f"Category:{name}",
        cmlimit=str(limit),
    )
    return data.get("categorymembers", [])
