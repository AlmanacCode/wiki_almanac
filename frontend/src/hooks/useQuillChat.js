import { useState, useRef, useCallback } from "react";
import { streamSSE } from "../lib/streamSSE";

const API = "/api/chat";

export function useQuillChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (prompt, articleTitle = null) => {
    if (!prompt.trim() || isStreaming) return;

    setError(null);

    // Add user message
    const userMsg = { id: crypto.randomUUID(), role: "user", content: prompt, parts: [] };
    setMessages(prev => [...prev, userMsg]);

    // Create placeholder assistant message
    const assistantMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      parts: [],
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      abortRef.current = new AbortController();
      const response = await fetch(`${API}/sessions/${sessionId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, article_title: articleTitle }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      for await (const event of streamSSE(response)) {
        switch (event.type) {
          case "start":
            setSessionId(event.session_id);
            break;

          case "text":
            setMessages(prev => {
              const msgs = [...prev];
              const last = { ...msgs[msgs.length - 1] };
              last.content += event.content;
              // Update or add text part
              const lastPart = last.parts[last.parts.length - 1];
              if (lastPart && lastPart.type === "text") {
                last.parts = [...last.parts.slice(0, -1), { ...lastPart, text: lastPart.text + event.content }];
              } else {
                last.parts = [...last.parts, { type: "text", text: event.content }];
              }
              msgs[msgs.length - 1] = last;
              return msgs;
            });
            break;

          case "tool_start":
            setMessages(prev => {
              const msgs = [...prev];
              const last = { ...msgs[msgs.length - 1] };
              last.parts = [...last.parts, {
                type: "tool",
                toolName: event.tool_name,
                callId: event.tool_call_id,
                args: event.args,
                result: null,
                isLoading: true,
              }];
              msgs[msgs.length - 1] = last;
              return msgs;
            });
            break;

          case "tool_result":
            setMessages(prev => {
              const msgs = [...prev];
              const last = { ...msgs[msgs.length - 1] };
              last.parts = last.parts.map(p =>
                p.type === "tool" && p.callId === event.tool_call_id
                  ? { ...p, result: event.result, isLoading: false }
                  : p
              );
              msgs[msgs.length - 1] = last;
              return msgs;
            });
            break;

          case "error":
            setError(event.message);
            break;

          case "end":
            break;
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [sessionId, isStreaming]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setError(null);
  }, []);

  return { messages, isStreaming, sessionId, error, sendMessage, stopStreaming, startNewChat };
}
