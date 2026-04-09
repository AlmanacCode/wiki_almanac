import { useState, useRef, useEffect } from "react";
import { useQuillChat } from "../../hooks/useQuillChat";
import ToolCallCard from "./ToolCallCard";

const SUGGESTIONS = [
  "What articles are in this wiki?",
  "Tell me about Gandalf",
  "Who are the members of the Fellowship?",
  "What happened at the Battle of Helm's Deep?",
  "Compare Mordor and The Shire",
];

export default function QuillDrawer({ isOpen, onClose, articleTitle }) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, startNewChat } = useQuillChat();
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!draft.trim() || isStreaming) return;
    sendMessage(draft.trim(), articleTitle);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    sendMessage(text, articleTitle);
  };

  if (!isOpen) return null;

  return (
    <div className="quill-overlay">
      <div className="quill-drawer">
        {/* Header */}
        <div className="quill-header">
          <div className="quill-title">
            <span className="quill-icon">&#x270D;&#xFE0F;</span>
            <span>Quill</span>
          </div>
          <div className="quill-actions">
            <button className="quill-btn-icon" onClick={startNewChat} title="New chat">+</button>
            <button className="quill-btn-icon" onClick={onClose} title="Close">&times;</button>
          </div>
        </div>

        {/* Messages */}
        <div className="quill-messages">
          {messages.length === 0 && (
            <div className="quill-welcome">
              <h3>Hi! I'm Quill</h3>
              <p>Your AI research assistant for Wiki Almanac. Ask me anything about the wiki's articles.</p>
              <div className="quill-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="quill-suggestion" onClick={() => handleSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`quill-msg quill-msg-${msg.role}`}>
              {msg.role === "user" ? (
                <div className="quill-bubble user">{msg.content}</div>
              ) : (
                <div className="quill-bubble assistant">
                  {msg.parts.map((part, i) => {
                    if (part.type === "text") {
                      return <span key={i} className="quill-text">{part.text}</span>;
                    }
                    if (part.type === "tool") {
                      return <ToolCallCard key={i} tool={part} />;
                    }
                    return null;
                  })}
                  {isStreaming && msg === messages[messages.length - 1] && msg.content === "" && msg.parts.length === 0 && (
                    <span className="quill-thinking">Thinking...</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="quill-error">{error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="quill-input-area">
          <textarea
            ref={inputRef}
            className="quill-input"
            placeholder="Ask Quill anything..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {isStreaming ? (
            <button className="quill-send-btn stop" onClick={stopStreaming}>Stop</button>
          ) : (
            <button className="quill-send-btn" onClick={handleSend} disabled={!draft.trim()}>Send</button>
          )}
        </div>
      </div>
    </div>
  );
}
