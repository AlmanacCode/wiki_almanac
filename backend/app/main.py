from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.wiki_client import wiki_client
from app.routers import pages, categories, search, site, ai, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    await wiki_client.start()
    yield
    await wiki_client.stop()


app = FastAPI(
    title="Wiki Almanac API",
    description="Backend wrapper over MediaWiki APIs with AI integration layer.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pages.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(site.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
