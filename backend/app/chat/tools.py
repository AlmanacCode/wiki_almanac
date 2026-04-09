"""Tools that Claude can call during chat.

Each tool is a plain async function. The TOOL_DEFINITIONS list
provides the Anthropic tool-use schema sent with API requests.
"""

import json
import os

import anthropic

from app.wiki_client import wiki_client


TOOL_DEFINITIONS = [
    {
        "name": "read_article",
        "description": "Read the full wikitext source of a wiki article. Use this when the user asks about an article's content or you need to answer questions about it.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The article title, e.g. 'Gandalf' or 'Middle-earth'",
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "search_wiki",
        "description": "Search the wiki for articles matching a query. Returns titles and short excerpts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_article_html",
        "description": "Get the rendered HTML and metadata (categories, sections, links) for an article. Use when you need structured info like categories or section headings.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The article title",
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "list_category_members",
        "description": "List all articles in a given category.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Category name without 'Category:' prefix, e.g. 'Characters'",
                },
            },
            "required": ["category"],
        },
    },
    {
        "name": "suggest_edit",
        "description": "Suggest modifications to a wiki article's wikitext. Use this when the user asks you to edit, improve, add content to, or modify an article. You MUST provide the complete modified wikitext — not a diff or partial change. The user will see a diff view comparing the original and your suggestion, and can accept or reject it.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The article title being edited",
                },
                "original_wikitext": {
                    "type": "string",
                    "description": "The current/original wikitext of the article",
                },
                "modified_wikitext": {
                    "type": "string",
                    "description": "The complete modified wikitext with your suggested changes applied",
                },
                "summary": {
                    "type": "string",
                    "description": "A short description of what was changed, e.g. 'Added section about Gandalf's fireworks'",
                },
            },
            "required": ["title", "original_wikitext", "modified_wikitext", "summary"],
        },
    },
]


async def execute_tool(name: str, args: dict) -> str:
    """Execute a tool by name and return the result as a string."""
    try:
        if name == "read_article":
            data = await wiki_client.rest_get(f"page/{args['title']}")
            return f"# {data['title']}\n\n{data['source']}"

        elif name == "search_wiki":
            data = await wiki_client.rest_get("search/page", q=args["query"], limit=10)
            pages = data.get("pages", [])
            if not pages:
                return "No results found."
            lines = []
            for p in pages:
                excerpt = p.get("excerpt", "").replace("<span class=\"searchmatch\">", "**").replace("</span>", "**")
                lines.append(f"- **{p['title']}**: {excerpt}")
            return "\n".join(lines)

        elif name == "get_article_html":
            parsed = await wiki_client.action_parse(
                page=args["title"], prop="text|categories|sections"
            )
            cats = ", ".join(c["category"] for c in parsed.get("categories", []))
            sections = ", ".join(s["line"] for s in parsed.get("sections", []))
            return f"Title: {parsed['title']}\nCategories: {cats}\nSections: {sections}"

        elif name == "list_category_members":
            data = await wiki_client.action_query(
                list="categorymembers",
                cmtitle=f"Category:{args['category']}",
                cmlimit="50",
            )
            members = data.get("categorymembers", [])
            if not members:
                return f"No articles in category '{args['category']}'."
            return "\n".join(f"- {m['title']}" for m in members)

        elif name == "suggest_edit":
            # Claude provides the modified wikitext directly.
            # We return it as a structured JSON so the frontend can parse it.
            return json.dumps({
                "type": "suggest_edit",
                "title": args["title"],
                "original": args["original_wikitext"],
                "modified": args["modified_wikitext"],
                "summary": args.get("summary", ""),
            })

        else:
            return f"Unknown tool: {name}"

    except Exception as e:
        return f"Error: {str(e)}"
