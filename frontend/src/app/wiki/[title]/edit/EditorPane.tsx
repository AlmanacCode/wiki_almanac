"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Feather, Check, X } from "lucide-react";
import { editPage, previewWikitext } from "@/lib/api";
import { useEditorContext, type EditSuggestion } from "@/components/AppShell";
import { PreviewDiff } from "./PreviewDiff";
import { QuillDrawer } from "@/components/quill/QuillDrawer";

interface EditorPaneProps {
  title: string;
  initialSource: string;
  initialHtml: string;
}

// ── Simple LCS diff ──

interface DiffLine {
  type: "same" | "add" | "remove";
  text: string;
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const oldLines = original.split("\n");
  const newLines = modified.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: "same", text: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", text: newLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "remove", text: oldLines[i - 1] });
      i--;
    }
  }
  return result;
}

// ── Inline diff source view ──

function InlineDiffSource({ diff }: { diff: DiffLine[] }) {
  return (
    <div className="font-mono text-sm leading-6 p-4 overflow-y-auto h-full">
      {diff.map((line, i) => (
        <div
          key={i}
          className={
            line.type === "add"
              ? "bg-success/15 text-foreground"
              : line.type === "remove"
              ? "bg-danger/15 text-foreground/60 line-through"
              : "text-foreground"
          }
        >
          <span className="inline-block w-6 text-right mr-3 select-none opacity-40 text-xs">
            {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
          </span>
          {line.text || "\u00A0"}
        </div>
      ))}
    </div>
  );
}

export function EditorPane({ title, initialSource, initialHtml }: EditorPaneProps) {
  const [content, setContent] = useState(initialSource);
  const [summary, setSummary] = useState("");
  const [html, setHtml] = useState(initialHtml);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<EditSuggestion | null>(null);
  const [suggestionPreviewHtml, setSuggestionPreviewHtml] = useState<string | null>(null);
  const [quillOpen, setQuillOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestContentRef = useRef(content);
  const { setOnEditSuggestion } = useEditorContext();

  latestContentRef.current = content;

  // Compute diff when suggestion is pending
  const diff = useMemo(() => {
    if (!pendingSuggestion) return null;
    return computeDiff(pendingSuggestion.original, pendingSuggestion.modified);
  }, [pendingSuggestion]);

  // Register the edit suggestion callback
  const handleEditSuggestion = useCallback(async (suggestion: EditSuggestion) => {
    setPendingSuggestion(suggestion);
    setSuggestionPreviewHtml(null);
    try {
      const rendered = await previewWikitext(suggestion.modified);
      setSuggestionPreviewHtml(rendered);
    } catch { /* best-effort */ }
  }, []);

  useEffect(() => {
    setOnEditSuggestion(handleEditSuggestion);
    return () => setOnEditSuggestion(null);
  }, [handleEditSuggestion, setOnEditSuggestion]);

  // Debounced live preview
  useEffect(() => {
    if (pendingSuggestion) return; // Don't preview while suggestion is shown
    clearTimeout(debounceRef.current);
    if (content === initialSource && html === initialHtml) return;

    debounceRef.current = setTimeout(async () => {
      const snapshot = content;
      setPreviewing(true);
      try {
        const rendered = await previewWikitext(snapshot);
        if (latestContentRef.current === snapshot) setHtml(rendered);
      } catch { /* best-effort */ }
      finally { setPreviewing(false); }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [content, initialSource, initialHtml, html, pendingSuggestion]);

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      await editPage(title, content, summary);
      setStatus("saved");
      try {
        const rendered = await previewWikitext(content);
        setHtml(rendered);
      } catch { /* best-effort */ }
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  function acceptSuggestion() {
    if (!pendingSuggestion) return;
    setContent(pendingSuggestion.modified);
    if (pendingSuggestion.summary) setSummary(pendingSuggestion.summary);
    if (suggestionPreviewHtml) setHtml(suggestionPreviewHtml);
    setPendingSuggestion(null);
    setSuggestionPreviewHtml(null);
  }

  function rejectSuggestion() {
    setPendingSuggestion(null);
    setSuggestionPreviewHtml(null);
  }

  const additions = diff?.filter((l) => l.type === "add").length ?? 0;
  const deletions = diff?.filter((l) => l.type === "remove").length ?? 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-surface border-b border-border shrink-0">
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
          className="flex-1 min-w-[120px] max-w-sm px-3 py-1.5 text-sm bg-surface-raised border border-border rounded-lg focus:outline-none focus:border-accent/50"
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

        <div className="ml-auto">
          <button
            onClick={() => setQuillOpen((o) => !o)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              quillOpen
                ? "bg-accent text-white"
                : "text-accent border border-accent/30 bg-accent-faint hover:bg-accent/[0.12]"
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            Quill
          </button>
        </div>
      </div>

      {/* Accept/Reject bar when suggestion is pending */}
      {pendingSuggestion && (
        <div className="flex items-center gap-3 px-4 py-2 bg-accent-faint border-b border-accent/20 shrink-0">
          <span className="text-sm font-medium text-foreground">{pendingSuggestion.summary}</span>
          <span className="text-xs text-foreground-faint">
            <span className="text-success">+{additions}</span>
            {" / "}
            <span className="text-danger">-{deletions}</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={rejectSuggestion}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-lg border border-border text-foreground-muted hover:bg-surface-raised transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
            <button
              onClick={acceptSuggestion}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Main area: Source + Preview + Quill */}
      <div className="flex flex-1 min-h-0">
        {/* Source pane — textarea or inline diff */}
        <div className={`flex flex-col border-r border-border ${quillOpen ? "w-1/3" : "w-1/2"} transition-all duration-200`}>
          <div className="px-3 py-1.5 text-[11px] font-mono text-accent bg-accent-faint border-b border-accent/15 uppercase tracking-wider">
            Source {pendingSuggestion && "· diff"}
          </div>
          {pendingSuggestion && diff ? (
            <div className="flex-1 overflow-y-auto bg-white">
              <InlineDiffSource diff={diff} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full font-mono text-sm bg-white border-none resize-none focus:outline-none p-4 overflow-y-auto"
              spellCheck={false}
            />
          )}
        </div>

        {/* Preview pane — current or suggested */}
        <div className={`flex flex-col ${quillOpen ? "w-1/3" : "w-1/2"} transition-all duration-200`}>
          <div className="px-3 py-1.5 text-[11px] font-mono text-accent bg-accent-faint border-b border-accent/15 uppercase tracking-wider">
            Preview {pendingSuggestion && "· after changes"}
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-surface-raised">
            {pendingSuggestion ? (
              suggestionPreviewHtml ? (
                <PreviewDiff oldHtml={html} newHtml={suggestionPreviewHtml} />
              ) : (
                <p className="text-sm text-foreground-faint animate-pulse">Rendering preview...</p>
              )
            ) : (
              <div
                className="wiki-content"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </div>
        </div>

        {/* Quill panel — inline */}
        {quillOpen && (
          <div className="w-1/3 border-l border-border flex flex-col bg-surface">
            <QuillDrawer
              open={true}
              onClose={() => setQuillOpen(false)}
              articleTitle={title}
              onEditSuggestion={handleEditSuggestion}
              inline
            />
          </div>
        )}
      </div>
    </div>
  );
}
