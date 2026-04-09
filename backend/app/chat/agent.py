"""Quill chat agent — streams Claude responses with tool use over SSE.

Supports two providers:
  - AWS Bedrock (default): set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
  - Anthropic direct: set ANTHROPIC_API_KEY
"""

import json
import os
from collections.abc import AsyncGenerator

import anthropic

from app.chat.session_store import ChatSession
from app.chat.tools import TOOL_DEFINITIONS, execute_tool


SYSTEM_PROMPT = """You are Quill, an AI research assistant for Wiki Almanac — a community encyclopedia about Middle-earth and Tolkien's works.

You help users explore, understand, and learn about the wiki's articles. You can:
- Read any article in the wiki to answer questions
- Search the wiki for relevant articles
- Look up categories and article metadata
- Explain connections between topics
- Suggest edits to articles when asked

Be conversational, specific, and cite article content when relevant. If you're unsure about something, search the wiki rather than guessing. Use your tools proactively to give informed answers.

Keep responses concise but thorough. When referencing wiki content, mention the article title so users can navigate to it.

## Editing articles

When the user asks you to edit, improve, or add content to an article:
1. First use `read_article` to get the current wikitext (unless you already have it in context)
2. Then use `suggest_edit` with the complete original and modified wikitext
3. The user will see a visual diff and can accept or reject your changes
4. Write proper MediaWiki wikitext syntax: '''bold''', ==Headings==, [[Links]], {{Templates}}
5. Make targeted changes — don't rewrite sections the user didn't ask about"""

# Bedrock model ID (same as OpenAlmanac)
BEDROCK_MODEL = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"


def _create_client() -> tuple[anthropic.AsyncAnthropic | anthropic.AsyncAnthropicBedrock, str]:
    """Create the appropriate client based on available credentials.

    Returns (client, model_id).
    """
    # Prefer Bedrock if AWS creds are set
    aws_key = os.environ.get("AWS_ACCESS_KEY_ID", "")
    aws_secret = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
    aws_region = os.environ.get("AWS_REGION", "us-east-1")

    if aws_key and aws_secret:
        client = anthropic.AsyncAnthropicBedrock(
            aws_access_key=aws_key,
            aws_secret_key=aws_secret,
            aws_region=aws_region,
        )
        return client, BEDROCK_MODEL

    # Fall back to direct Anthropic API
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        return client, ANTHROPIC_MODEL

    return None, ""


async def stream_chat(session: ChatSession, prompt: str) -> AsyncGenerator[str, None]:
    """Stream a chat response as SSE events."""
    client, model = _create_client()
    if not client:
        yield _sse({
            "type": "error",
            "message": "No AI credentials configured. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (for Bedrock) or ANTHROPIC_API_KEY.",
        })
        return

    # Add user message to history
    session.messages.append({"role": "user", "content": prompt})

    yield _sse({"type": "start", "session_id": session.session_id})

    try:
        # Build messages for API (keep last 20 messages for context window)
        api_messages = session.messages[-20:]

        # Stream with tool use loop
        full_response = ""
        while True:
            collected_text = ""
            tool_calls = []

            async with client.messages.stream(
                model=model,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=api_messages,
                tools=TOOL_DEFINITIONS,
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_start":
                        if event.content_block.type == "tool_use":
                            tool_calls.append({
                                "id": event.content_block.id,
                                "name": event.content_block.name,
                                "input_json": "",
                            })
                            yield _sse({
                                "type": "tool_start",
                                "tool_name": event.content_block.name,
                                "tool_call_id": event.content_block.id,
                                "args": {},
                            })

                    elif event.type == "content_block_delta":
                        if event.delta.type == "text_delta":
                            collected_text += event.delta.text
                            yield _sse({"type": "text", "content": event.delta.text})
                        elif event.delta.type == "input_json_delta":
                            if tool_calls:
                                tool_calls[-1]["input_json"] += event.delta.partial_json

                    elif event.type == "content_block_stop":
                        pass

                # Get the final message to check stop reason
                final_message = await stream.get_final_message()

            full_response += collected_text

            # If no tool calls, we're done
            if final_message.stop_reason != "tool_use":
                break

            # Execute tool calls and continue the conversation
            assistant_content = []
            if collected_text:
                assistant_content.append({"type": "text", "text": collected_text})
            for tc in tool_calls:
                try:
                    args = json.loads(tc["input_json"]) if tc["input_json"] else {}
                except json.JSONDecodeError:
                    args = {}

                assistant_content.append({
                    "type": "tool_use",
                    "id": tc["id"],
                    "name": tc["name"],
                    "input": args,
                })

            api_messages.append({"role": "assistant", "content": assistant_content})

            # Execute each tool and build tool results
            tool_results = []
            for tc in tool_calls:
                try:
                    args = json.loads(tc["input_json"]) if tc["input_json"] else {}
                except json.JSONDecodeError:
                    args = {}

                result = await execute_tool(tc["name"], args)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tc["id"],
                    "content": result,
                })
                # Send full result for suggest_edit (frontend needs the complete wikitext)
                # Truncate other tools to 500 chars for the SSE stream
                streamed_result = result if tc["name"] == "suggest_edit" else result[:500]
                yield _sse({
                    "type": "tool_result",
                    "tool_name": tc["name"],
                    "tool_call_id": tc["id"],
                    "result": streamed_result,
                })

            api_messages.append({"role": "user", "content": tool_results})

        # Save assistant response to session
        session.messages.append({"role": "assistant", "content": full_response})

        yield _sse({"type": "end"})

    except anthropic.APIError as e:
        yield _sse({"type": "error", "message": f"API error: {str(e)}"})
    except Exception as e:
        yield _sse({"type": "error", "message": f"Error: {str(e)}"})


def _sse(data: dict) -> str:
    """Format a dict as an SSE event line."""
    return f"event: message\ndata: {json.dumps(data)}\n\n"
