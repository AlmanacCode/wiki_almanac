"use client";

import { Check, X } from "lucide-react";

interface DiffViewProps {
  original: string;
  modified: string;
  summary: string;
  onAccept: () => void;
  onReject: () => void;
}

interface DiffLine {
  type: "same" | "add" | "remove";
  text: string;
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const oldLines = original.split("\n");
  const newLines = modified.split("\n");
  const lines: DiffLine[] = [];

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
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

  return result.length > 0 ? result : lines;
}

export function DiffView({ original, modified, summary, onAccept, onReject }: DiffViewProps) {
  const diff = computeDiff(original, modified);
  const additions = diff.filter((l) => l.type === "add").length;
  const deletions = diff.filter((l) => l.type === "remove").length;

  return (
    <div className="rounded-2xl border border-accent/30 bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-accent-faint border-b border-accent/20">
        <div>
          <p className="text-sm font-medium text-foreground">{summary}</p>
          <p className="text-xs text-foreground-faint mt-0.5">
            <span className="text-success">+{additions}</span>
            {" / "}
            <span className="text-danger">-{deletions}</span>
            {" lines"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border text-foreground-muted hover:bg-surface-raised transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>
          <button
            onClick={onAccept}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Accept
          </button>
        </div>
      </div>

      {/* Diff lines */}
      <div className="max-h-[400px] overflow-y-auto font-mono text-xs leading-6">
        {diff.map((line, i) => (
          <div
            key={i}
            className={`px-4 ${
              line.type === "add"
                ? "bg-success/10 text-success"
                : line.type === "remove"
                ? "bg-danger/10 text-danger line-through"
                : "text-foreground-faint"
            }`}
          >
            <span className="inline-block w-5 select-none opacity-50">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            {line.text || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}
