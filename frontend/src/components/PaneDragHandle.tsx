"use client";

import { useCallback, useRef } from "react";

interface PaneDragHandleProps {
  onDrag: (deltaX: number) => void;
  onDragEnd?: () => void;
}

export function PaneDragHandle({ onDrag, onDragEnd }: PaneDragHandleProps) {
  const startXRef = useRef(0);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      dragging.current = true;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = ev.clientX - startXRef.current;
        startXRef.current = ev.clientX;
        onDrag(delta);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onDragEnd?.();
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onDrag, onDragEnd]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1.5 cursor-col-resize bg-border/40 hover:bg-accent/30 active:bg-accent/50 transition-colors shrink-0 relative group"
      title="Drag to resize"
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-foreground-faint/30 group-hover:bg-accent/50 transition-colors" />
    </div>
  );
}
