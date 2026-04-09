from fastapi import APIRouter, HTTPException, Query
from app.wiki_client import wiki_client
from app.schemas import (
    PageSummary, ParsedPage, PageSource, PageHistory, PageRevision,
    EditRequest, EditResponse, PageExtract, PageCategory,
)

router = APIRouter(prefix="/pages", tags=["Pages"])


@router.get("/", response_model=list[PageSummary], summary="List all pages")
async def list_pages(limit: int = Query(50, le=500)):
    data = await wiki_client.action_query(list="allpages", aplimit=str(limit))
    return data.get("allpages", [])


@router.get("/{title}/parsed", response_model=ParsedPage, summary="Get parsed article HTML")
async def get_parsed_page(title: str):
    try:
        parsed = await wiki_client.action_parse(
            page=title, prop="text|categories|links|sections|displaytitle"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return ParsedPage(
        title=parsed["title"],
        pageid=parsed["pageid"],
        displaytitle=parsed.get("displaytitle", parsed["title"]),
        text=parsed["text"],
        categories=parsed.get("categories", []),
        links=parsed.get("links", []),
        sections=parsed.get("sections", []),
    )


@router.get("/{title}/source", response_model=PageSource, summary="Get page wikitext source")
async def get_page_source(title: str):
    try:
        data = await wiki_client.rest_get(f"page/{title}")
    except Exception:
        raise HTTPException(status_code=404, detail=f"Page '{title}' not found")
    return PageSource(
        id=data["id"],
        key=data["key"],
        title=data["title"],
        source=data["source"],
        content_model=data["content_model"],
        latest_revision_id=data["latest"]["id"],
        latest_timestamp=data["latest"]["timestamp"],
    )


@router.get("/{title}/history", response_model=PageHistory, summary="Get page revision history")
async def get_page_history(title: str, limit: int = Query(20, le=100)):
    data = await wiki_client.action_query(
        prop="revisions",
        titles=title,
        rvprop="ids|timestamp|user|comment|size",
        rvlimit=str(limit),
    )
    pages = data.get("pages", [])
    if not pages or "missing" in pages[0]:
        raise HTTPException(status_code=404, detail=f"Page '{title}' not found")
    page = pages[0]
    revisions = [
        PageRevision(
            revid=r["revid"],
            parentid=r.get("parentid", 0),
            user=r.get("user", ""),
            timestamp=r["timestamp"],
            comment=r.get("comment", ""),
            size=r.get("size", 0),
        )
        for r in page.get("revisions", [])
    ]
    return PageHistory(title=page["title"], pageid=page["pageid"], revisions=revisions)


@router.get("/random", response_model=PageSummary, summary="Get a random page")
async def get_random_page():
    data = await wiki_client.action_query(list="random", rnnamespace="0", rnlimit="1")
    pages = data.get("random", [])
    if not pages:
        raise HTTPException(status_code=404, detail="No pages found")
    p = pages[0]
    return PageSummary(pageid=p.get("pageid", p.get("id", 0)), title=p["title"], ns=p.get("ns", 0))


@router.post("/extracts", response_model=list[PageExtract], summary="Get short text extracts for multiple pages")
async def get_page_extracts(titles: list[str]):
    joined = "|".join(titles)
    data = await wiki_client.action_query(
        prop="extracts|categories",
        titles=joined,
        exintro="1",
        explaintext="1",
        exsentences="3",
    )
    pages = data.get("pages", [])
    return [
        PageExtract(
            pageid=p["pageid"],
            title=p["title"],
            extract=p.get("extract"),
            categories=[
                PageCategory(category=c["title"].replace("Category:", ""), sortkey="")
                for c in p.get("categories", [])
            ],
        )
        for p in pages
        if "pageid" in p
    ]


@router.get("/{title}/related", response_model=list[PageSummary], summary="Get related pages via shared categories")
async def get_related_pages(title: str, limit: int = Query(6, le=20)):
    # Get categories for this page
    data = await wiki_client.action_query(prop="categories", titles=title)
    pages = data.get("pages", [])
    if not pages:
        return []
    cats = [c["title"] for c in pages[0].get("categories", [])][:2]
    if not cats:
        return []
    # Get members from those categories
    seen = {title}
    related = []
    for cat in cats:
        cat_data = await wiki_client.action_query(
            list="categorymembers", cmtitle=cat, cmlimit="10"
        )
        for m in cat_data.get("categorymembers", []):
            if m["title"] not in seen:
                seen.add(m["title"])
                related.append(PageSummary(pageid=m["pageid"], title=m["title"], ns=m.get("ns", 0)))
            if len(related) >= limit:
                break
        if len(related) >= limit:
            break
    return related


@router.post("/{title}/edit", response_model=EditResponse, summary="Edit or create a page")
async def edit_page(title: str, req: EditRequest):
    token = await wiki_client.get_csrf_token()
    result = await wiki_client.action_post(
        action="edit",
        title=title,
        text=req.content,
        summary=req.summary,
        token=token,
    )
    edit = result.get("edit", {})
    if edit.get("result") != "Success":
        raise HTTPException(status_code=400, detail=f"Edit failed: {edit}")
    return EditResponse(
        result=edit["result"],
        pageid=edit["pageid"],
        title=edit["title"],
        oldrevid=edit.get("oldrevid", 0),
        newrevid=edit["newrevid"],
    )
