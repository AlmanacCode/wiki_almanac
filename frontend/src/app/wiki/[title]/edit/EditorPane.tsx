"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { editPage, previewWikitext } from "@/lib/api";

interface EditorPaneProps {
  title: string;
  initialSource: string;
  initialHtml: string;
}

export function EditorPane({ title, initialSource, initialHtml }: EditorPaneProps) {
  const [content, setContent] = useState(initialSource);
  const [summary, setSummary] = useState("");
  const [html, setHtml] = useState(initialHtml);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestContentRef = useRef(content);

  // Track latest content for stale-check
  latestContentRef.current = content;

  // Debounced live preview — 500ms after user stops typing
  useEffect(() => {
    clearTimeout(debounceRef.current);

    // Don't preview if content hasn't changed from initial
    if (content === initialSource && html === initialHtml) return;

    debounceRef.current = setTimeout(async () => {
      const snapshot = content;
      setPreviewing(true);
      try {
        const rendered = await previewWikitext(snapshot);
        // Only update if content hasn't changed while we were fetching
        if (latestContentRef.current === snapshot) {
          setHtml(rendered);
        }
      } catch {
        // Silently fail — preview is best-effort
      } finally {
        setPreviewing(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [content, initialSource, initialHtml, html]);

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      await editPage(title, content, summary);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-surface border-b border-border">
        <Link
          href={`/wiki/${encodeURIComponent(title)}`}
          className="text-sm text-accent hover:text-accent-hover transition-colors"
        >
          &larr; {title}
        </Link>

        <input
          type="text"
          placeholder="Edit summary..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="flex-1 min-w-[160px] max-w-md px-3 py-1.5 text-sm bg-surface-raised border border-border rounded-lg focus:outline-none focus:border-accent/50"
        />

        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-accent text-white hover:bg-accent-hover rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {status === "saving" ? "Saving..." : "Save"}
        </button>

        {status === "saved" && <span className="text-sm text-success">Saved!</span>}
        {status === "error" && <span className="text-sm text-danger">{errorMsg}</span>}
        {previewing && <span className="text-xs text-foreground-faint">Updating preview...</span>}
      </div>

      {/* Split panes */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Source editor */}
        <div className="flex-1 min-h-[300px] md:min-h-0 border-b md:border-b-0 md:border-r border-border">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full font-mono text-sm bg-surface border-none resize-none focus:outline-none p-4"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="flex-1 min-h-[300px] md:min-h-0 overflow-y-auto p-6">
          <div
            className="wiki-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
