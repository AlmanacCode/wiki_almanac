from pydantic import BaseModel


# ── Pages ──

class PageSummary(BaseModel):
    pageid: int
    title: str
    ns: int = 0


class PageSection(BaseModel):
    toclevel: int
    level: str
    line: str
    number: str
    anchor: str


class PageCategory(BaseModel):
    sortkey: str = ""
    category: str


class PageLink(BaseModel):
    ns: int
    title: str
    exists: bool


class ParsedPage(BaseModel):
    title: str
    pageid: int
    displaytitle: str
    text: str
    categories: list[PageCategory]
    links: list[PageLink]
    sections: list[PageSection]


class PageSource(BaseModel):
    id: int
    key: str
    title: str
    source: str
    content_model: str
    latest_revision_id: int
    latest_timestamp: str


class PageRevision(BaseModel):
    revid: int
    parentid: int = 0
    user: str
    timestamp: str
    comment: str
    size: int


class PageHistory(BaseModel):
    title: str
    pageid: int
    revisions: list[PageRevision]


# ── Categories ──

class Category(BaseModel):
    category: str


class CategoryMember(BaseModel):
    pageid: int
    ns: int = 0
    title: str


# ── Search ──

class SearchResult(BaseModel):
    id: int
    key: str
    title: str
    excerpt: str | None = None
    description: str | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


# ── Site ──

class SiteStats(BaseModel):
    pages: int
    articles: int
    edits: int
    images: int
    users: int
    activeusers: int
    admins: int


# ── Edit ──

class EditRequest(BaseModel):
    title: str
    content: str
    summary: str = ""


class EditResponse(BaseModel):
    result: str
    pageid: int
    title: str
    oldrevid: int
    newrevid: int


# ── Page Extract (for featured/preview cards) ──

class PageExtract(BaseModel):
    pageid: int
    title: str
    extract: str | None = None
    categories: list[PageCategory] = []
