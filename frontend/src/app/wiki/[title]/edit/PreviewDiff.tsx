"use client";

import { useEffect, useRef, useMemo } from "react";

/**
 * Shows rendered HTML with green highlights on new/changed blocks
 * by comparing old and new HTML content at the block level.
 */
export function PreviewDiff({
  oldHtml,
  newHtml,
}: {
  oldHtml: string;
  newHtml: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract text content of block elements from HTML string
  const oldTexts = useMemo(() => extractBlockTexts(oldHtml), [oldHtml]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Walk all block-level children and highlight those whose text isn't in the old version
    const blocks = el.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, tr, blockquote, pre, dt, dd");
    blocks.forEach((block) => {
      const text = (block.textContent || "").trim();
      if (!text) return;

      if (!oldTexts.has(text)) {
        // This block is new or changed
        (block as HTMLElement).style.backgroundColor = "rgba(67, 122, 80, 0.12)";
        (block as HTMLElement).style.borderLeft = "3px solid rgba(67, 122, 80, 0.5)";
        (block as HTMLElement).style.paddingLeft = "8px";
        (block as HTMLElement).style.borderRadius = "2px";
      }
    });
  }, [newHtml, oldTexts]);

  return (
    <div
      ref={containerRef}
      className="wiki-content"
      dangerouslySetInnerHTML={{ __html: newHtml }}
    />
  );
}

function extractBlockTexts(html: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const div = document.createElement("div");
  div.innerHTML = html;
  const texts = new Set<string>();
  const blocks = div.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, tr, blockquote, pre, dt, dd");
  blocks.forEach((block) => {
    const text = (block.textContent || "").trim();
    if (text) texts.add(text);
  });
  return texts;
}
