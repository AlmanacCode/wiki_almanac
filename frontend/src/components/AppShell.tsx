"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { SiteFooter } from "./SiteFooter";
import { QuillDrawer } from "./quill/QuillDrawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quillOpen, setQuillOpen] = useState(false);
  const pathname = usePathname();

  // Extract article title from /wiki/[title] paths
  const wikiMatch = pathname.match(/^\/wiki\/(.+)$/);
  const articleTitle = wikiMatch
    ? decodeURIComponent(wikiMatch[1])
    : undefined;

  return (
    <>
      <Header
        onToggleQuill={() => setQuillOpen((o) => !o)}
        quillOpen={quillOpen}
      />
      <main className="flex-1 relative">{children}</main>
      <SiteFooter />
      <QuillDrawer
        open={quillOpen}
        onClose={() => setQuillOpen(false)}
        articleTitle={articleTitle}
      />
    </>
  );
}
