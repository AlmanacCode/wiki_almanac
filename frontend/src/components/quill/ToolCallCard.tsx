"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Check } from "lucide-react";
import type { ToolPart } from "@/hooks/useQuillChat";

export function ToolCallCard({ part }: { part: ToolPart }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 rounded-xl border border-border/60 bg-surface-raised text-sm overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-background/50 transition-colors"
      >
        {part.isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
        ) : (
          <Check className="w-3.5 h-3.5 text-success shrink-0" />
        )}
        <span className="font-mono text-xs text-foreground-muted truncate flex-1">
          {part.toolName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-foreground-faint transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border-subtle">
          <div>
            <p className="text-xs text-foreground-faint mt-2 mb-1">Arguments</p>
            <pre className="text-xs font-mono bg-background rounded-lg p-2 overflow-x-auto text-foreground-muted">
              {JSON.stringify(part.args, null, 2)}
            </pre>
          </div>
          {part.result && (
            <div>
              <p className="text-xs text-foreground-faint mb-1">Result</p>
              <pre className="text-xs font-mono bg-background rounded-lg p-2 overflow-x-auto text-foreground-muted max-h-40 overflow-y-auto">
                {part.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
