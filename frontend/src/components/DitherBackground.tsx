"use client";

import dynamic from "next/dynamic";

const DitheredBackground = dynamic(
  () => import("@/components/DitheredBackground"),
  { ssr: false }
);

export function DitherBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background">
      <div className="absolute inset-0 w-full h-full opacity-30">
        <DitheredBackground
          src="/parchment.mp4"
          colorNum={2}
          pixelSize={3}
          className="w-full h-full"
        />
      </div>

      {/* Gradient overlay — fades the dither for text readability */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background:
            "linear-gradient(to bottom, rgba(252,251,250,1) 0%, rgba(252,251,250,0.95) 8%, rgba(252,251,250,0.75) 25%, rgba(245,238,230,0.45) 50%, rgba(179,89,34,0.12) 70%, rgba(179,89,34,0.04) 90%)",
        }}
      />
    </div>
  );
}
