"use client";

import { useRef, useCallback } from "react";

export function GlowGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const grid = gridRef.current;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    grid.style.setProperty("--glow-x", `${x}px`);
    grid.style.setProperty("--glow-y", `${y}px`);

    const cards = grid.querySelectorAll<HTMLElement>("[data-glow-card]");
    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardX = e.clientX - cardRect.left;
      const cardY = e.clientY - cardRect.top;
      card.style.setProperty("--card-glow-x", `${cardX}px`);
      card.style.setProperty("--card-glow-y", `${cardY}px`);
    });
  }, []);

  return (
    <div
      ref={gridRef}
      className={`glow-grid ${className}`}
      onPointerMove={handlePointerMove}
    >
      <div className="glow-grid__ambient" />
      {children}
    </div>
  );
}
