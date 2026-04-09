"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { SiteFooter } from "./SiteFooter";
import { QuillDrawer } from "./quill/QuillDrawer";
import { DitherBackground } from "./DitherBackground";

export interface EditSuggestion {
  title: string;
  original: string;
  modified: string;
  summary: string;
}

interface EditorContextValue {
  onEditSuggestion: ((suggestion: EditSuggestion) => void) | null;
  setOnEditSuggestion: (cb: ((suggestion: EditSuggestion) => void) | null) => void;
}

const EditorContext = createContext<EditorContextValue>({
  onEditSuggestion: null,
  setOnEditSuggestion: () => {},
});

export function useEditorContext() {
  return useContext(EditorContext);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quillOpen, setQuillOpen] = useState(false);
  const [onEditSuggestion, setOnEditSuggestion] = useState<((s: EditSuggestion) => void) | null>(null);
  const pathname = usePathname();

  const isEditorPage = pathname.endsWith("/edit");
  const isHomePage = pathname === "/";
  const isArticlePage = pathname.startsWith("/wiki/") && !isEditorPage;

  // Extract article title from /wiki/[title] or /wiki/[title]/edit paths
  const wikiMatch = pathname.match(/^\/wiki\/([^/]+)/);
  const articleTitle = wikiMatch
    ? decodeURIComponent(wikiMatch[1])
    : undefined;

  const handleSetCallback = useCallback((cb: ((s: EditSuggestion) => void) | null) => {
    setOnEditSuggestion(() => cb);
  }, []);

  return (
    <EditorContext.Provider value={{ onEditSuggestion, setOnEditSuggestion: handleSetCallback }}>
      {/* Dither background only on homepage and non-article pages */}
      {!isArticlePage && !isEditorPage && <DitherBackground />}
      <div className={`relative ${!isArticlePage && !isEditorPage ? "z-10" : ""} flex flex-col flex-1`}>
      <Header
        onToggleQuill={isEditorPage ? undefined : () => setQuillOpen((o) => !o)}
        quillOpen={quillOpen}
      />
      <main className={`flex-1 relative ${isArticlePage ? "bg-white" : ""}`}>{children}</main>
      {!isEditorPage && <SiteFooter />}
      {/* Global Quill drawer — hidden on editor page (editor has its own inline Quill) */}
      {!isEditorPage && (
        <QuillDrawer
          open={quillOpen}
          onClose={() => setQuillOpen(false)}
          articleTitle={articleTitle}
          onEditSuggestion={onEditSuggestion}
        />
      )}
      </div>
    </EditorContext.Provider>
  );
}
