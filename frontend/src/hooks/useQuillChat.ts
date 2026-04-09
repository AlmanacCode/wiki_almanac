"use client";

import { useState, useRef, useCallback } from "react";
import { streamSSE } from "@/lib/streamSSE";

export interface TextPart {
  type: "text";
  content: string;
}

export interface ToolPart {
  type: "tool";
  toolName: string;
  callId: string;
  args: Record<string, unknown>;
  result: string | null;
  isLoading: boolean;
}

export type MessagePart = TextPart | ToolPart;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
}

// Matches backend SSE event shapes
interface SSEEvent {
  type: string;
  session_id?: string;
  content?: string;
  tool_name?: string;
  tool_call_id?: string;
  args?: Record<string, unknown>;
  result?: string;
  message?: string;
}

export function useQuillChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (prompt: string, articleTitle: string | null = null) => {
      if (!prompt.trim() || isStreaming) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        parts: [],
      };
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        parts: [],
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/chat/sessions/${sessionId}/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, article_title: articleTitle }),
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        for await (const event of streamSSE<SSEEvent>(res)) {
          switch (event.type) {
            case "start":
              if (event.session_id) setSessionId(event.session_id);
              break;

            case "text":
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.content += event.content ?? "";
                const lastPart = last.parts[last.parts.length - 1];
                if (lastPart && lastPart.type === "text") {
                  last.parts = [
                    ...last.parts.slice(0, -1),
                    { ...lastPart, content: lastPart.content + (event.content ?? "") },
                  ];
                } else {
                  last.parts = [...last.parts, { type: "text", content: event.content ?? "" }];
                }
                msgs[msgs.length - 1] = last;
                return msgs;
              });
              break;

            case "tool_start":
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.parts = [
                  ...last.parts,
                  {
                    type: "tool",
                    toolName: event.tool_name ?? "unknown",
                    callId: event.tool_call_id ?? "",
                    args: event.args ?? {},
                    result: null,
                    isLoading: true,
                  },
                ];
                msgs[msgs.length - 1] = last;
                return msgs;
              });
              break;

            case "tool_result":
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.parts = last.parts.map((p) =>
                  p.type === "tool" && (p as ToolPart).callId === event.tool_call_id
                    ? { ...p, result: event.result ?? null, isLoading: false }
                    : p
                );
                msgs[msgs.length - 1] = last;
                return msgs;
              });
              break;

            case "error":
              setError(event.message ?? "Unknown error");
              break;
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [sessionId, isStreaming]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setError(null);
    setIsStreaming(false);
    abortRef.current?.abort();
  }, []);

  return { messages, isStreaming, error, sendMessage, stop, startNewChat };
}
