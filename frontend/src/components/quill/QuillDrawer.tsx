"use client";

import { useState, useRef, useEffect } from "react";
import { Feather, Plus, X, ArrowUp, Square } from "lucide-react";
import { useQuillChat, type ChatMessage, type ToolPart } from "@/hooks/useQuillChat";
import { ToolCallCard } from "./ToolCallCard";

const THINKING_PHRASES = [
  "Consulting the scrolls...",
  "Searching the archives...",
  "Pondering ancient texts...",
  "Leafing through tomes...",
  "Deciphering runes...",
  "Tracing lineages...",
];

function ThinkingIndicator() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % THINKING_PHRASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-3 animate-fade-in">
      <Feather className="w-4 h-4 text-accent" style={{ animation: "quill-scribble 0.8s ease-in-out infinite" }} />
      <span className="text-sm text-foreground-faint" style={{ animation: "pulse-soft 2s ease-in-out infinite" }}>
        {THINKING_PHRASES[phraseIdx]}
      </span>
    </div>
  );
}

const SUGGESTIONS = [
  "Tell me about the Rings of Power",
  "Who are the Istari?",
  "Explain the history of Gondor",
  "What happened at Helm's Deep?",
];

function WelcomeScreen({ onSuggest }: { onSuggest: (s: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <Feather className="w-10 h-10 text-accent/40" />
      <h3 className="font-heading text-lg text-foreground">Ask Quill anything</h3>
      <p className="text-sm text-foreground-faint max-w-xs">
        Your AI research companion for Middle-earth lore
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-accent/30 hover:bg-accent-faint text-foreground-muted transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-user-slide-in">
        <div className="max-w-[85%] bg-accent text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-bubble-fade-in space-y-1">
      {message.parts.map((part, i) => {
        if (part.type === "tool") {
          return <ToolCallCard key={i} part={part as ToolPart} />;
        }
        return (
          <div
            key={i}
            className="text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap"
          >
            {part.content}
          </div>
        );
      })}
    </div>
  );
}

export function QuillDrawer({
  open,
  onClose,
  articleTitle,
  onEditSuggestion,
  inline = false,
}: {
  open: boolean;
  onClose: () => void;
  articleTitle?: string;
  onEditSuggestion?: ((suggestion: { title: string; original: string; modified: string; summary: string }) => void) | null;
  inline?: boolean;
}) {
  const { messages, isStreaming, error, sendMessage, stop, startNewChat } = useQuillChat();
  const processedSuggestions = useRef(new Set<string>());
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Watch for suggest_edit tool results and forward to editor
  useEffect(() => {
    if (!onEditSuggestion) return;
    for (const msg of messages) {
      for (const part of msg.parts) {
        if (part.type === "tool" && (part as ToolPart).toolName === "suggest_edit" && (part as ToolPart).result) {
          const tp = part as ToolPart;
          const key = tp.callId;
          if (processedSuggestions.current.has(key)) continue;
          try {
            const data = JSON.parse(tp.result!);
            if (data.type === "suggest_edit" && data.modified) {
              processedSuggestions.current.add(key);
              onEditSuggestion(data);
            }
          } catch {
            // Not valid JSON, skip
          }
        }
      }
    }
  }, [messages, onEditSuggestion]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text, articleTitle ?? null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <div
      className={
        inline
          ? "flex flex-col h-full w-full"
          : `fixed top-0 right-0 h-full w-[400px] max-w-full bg-surface border-l border-border z-50 flex flex-col transition-transform duration-300 ease-in-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-accent" />
          <span className="font-heading text-sm font-semibold">Quill</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={startNewChat}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-foreground-faint hover:text-foreground transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-foreground-faint hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <WelcomeScreen
            onSuggest={(s) => {
              setInput("");
              sendMessage(s, articleTitle ? `Currently reading: ${articleTitle}` : undefined);
            }}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].parts.length === 0 && (
                <ThinkingIndicator />
              )}
          </>
        )}
        {error && (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Middle-earth..."
            rows={1}
            className="flex-1 resize-none rounded-xl bg-surface-raised border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
          />
          {isStreaming ? (
            <button
              onClick={stop}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-danger text-white hover:bg-danger/90 transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
