# Next.js + Terracotta Aesthetic Migration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Wiki Almanac frontend from Vite+React Router to Next.js App Router with Tailwind CSS, and apply the OpenAlmanac terracotta aesthetic (colors, fonts, icons, animations, card styles).

**Architecture:** Next.js 15 App Router with server components for data fetching (SSR for SEO), client components for interactivity (search, Quill drawer). Tailwind CSS for styling. API calls proxy to FastAPI backend at `127.0.0.1:8000` via Next.js rewrites. Lucide React for icons (Feather = Quill brand icon).

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Lucide React, Google Fonts (Libre Caslon Text, Merriweather, Outfit, EB Garamond, JetBrains Mono)

---

### Task 1: Scaffold Next.js app and install dependencies

**Files:**
- Delete: `frontend/` (entire old Vite app)
- Create: `frontend/` (new Next.js app)

**Step 1: Remove old frontend**
```bash
cd /Users/divitsheth/Documents/GitHub/wiki_almanac
rm -rf frontend/
```

**Step 2: Create new Next.js app**
```bash
cd /Users/divitsheth/Documents/GitHub/wiki_almanac
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```
When prompted, accept defaults. This gives us: Next.js + TypeScript + Tailwind + App Router + `src/` dir.

**Step 3: Install additional dependencies**
```bash
cd frontend
npm install lucide-react
```

**Step 4: Configure API proxy**

Create `frontend/next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

**Step 5: Verify it runs**
```bash
cd frontend && npm run dev
```
Expected: Next.js dev server starts on port 3000.

**Step 6: Commit**
```bash
git add frontend/
git commit -m "feat: scaffold Next.js frontend with Tailwind and Lucide"
```

---

### Task 2: Set up terracotta design system (globals, fonts, theme)

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Replace globals.css with terracotta theme**

Write `frontend/src/app/globals.css`:
```css
@import "tailwindcss";

@theme inline {
  /* ── Terracotta palette ── */
  --color-background: #fcfbfa;
  --color-surface: #ffffff;
  --color-surface-raised: #f5f4f1;
  --color-border: #e6e4df;
  --color-border-subtle: #f0efeb;
  --color-foreground: #1c1a19;
  --color-foreground-muted: #5c5855;
  --color-foreground-faint: #8a8580;
  --color-accent: #b35922;
  --color-accent-hover: #cc6d33;
  --color-accent-faint: rgba(179, 89, 34, 0.08);
  --color-accent-glow: rgba(179, 89, 34, 0.15);
  --color-success: #437a50;
  --color-danger: #bb4444;

  /* ── Fonts ── */
  --font-serif: var(--font-libre-caslon);
  --font-heading: var(--font-merriweather);
  --font-sans: var(--font-outfit);
  --font-mono: var(--font-jetbrains-mono);
}

/* ── Base ── */
body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-subtle) transparent;
}

::selection {
  background: var(--color-accent);
  color: var(--color-background);
}

/* ── Animations ── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes quill-scribble {
  0% { transform: translateX(0) rotate(8deg); }
  25% { transform: translateX(2px) rotate(-7deg); }
  50% { transform: translateX(6px) rotate(10deg); }
  75% { transform: translateX(2px) rotate(-5deg); }
  100% { transform: translateX(0) rotate(8deg); }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes bubbleFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes userSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out both;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out both;
}

.animate-bubble-fade-in {
  animation: bubbleFadeIn 0.4s ease-out;
}

.animate-user-slide-in {
  animation: userSlideIn 0.3s ease-out;
}

.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }

/* ── Glow grid (cursor-following card glow) ── */
.glow-grid {
  position: relative;
  --glow-x: 0px;
  --glow-y: 0px;
  --glow-opacity: 0;
}

.glow-grid__ambient {
  position: absolute;
  inset: -40px;
  pointer-events: none;
  z-index: 0;
  opacity: var(--glow-opacity);
  transition: opacity 0.4s ease;
  background: radial-gradient(600px circle at var(--glow-x) var(--glow-y), var(--color-accent-glow), transparent 40%);
}

[data-glow-card] {
  position: relative;
  z-index: 1;
  --spot-x: 50%;
  --spot-y: 50%;
}

[data-glow-card]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(300px circle at var(--spot-x) var(--spot-y), rgba(179, 89, 34, 0.07), transparent 40%);
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
}

[data-glow-card]:hover::after {
  opacity: 1;
}

/* ── Skeleton loading ── */
.skeleton {
  background: linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-border-subtle) 50%, var(--color-surface-raised) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 6px;
}

/* ── Wiki content (MediaWiki HTML) ── */
.wiki-content h2 {
  font-family: var(--font-heading), serif;
  font-size: 1.5rem;
  font-weight: 400;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-foreground);
}

.wiki-content h3 {
  font-family: var(--font-heading), serif;
  font-size: 1.2rem;
  font-weight: 400;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-foreground);
}

.wiki-content p {
  margin-bottom: 1rem;
  line-height: 1.7;
}

.wiki-content a {
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.wiki-content a:hover {
  border-bottom-color: var(--color-accent);
}

.wiki-content blockquote {
  border-left: 3px solid var(--color-accent);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--color-foreground-muted);
  font-style: italic;
}

.wiki-content ul, .wiki-content ol {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.wiki-content li {
  margin-bottom: 0.25rem;
  line-height: 1.7;
}

.wiki-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.wiki-content th, .wiki-content td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  text-align: left;
}

.wiki-content th {
  background: var(--color-surface-raised);
  font-weight: 600;
}

/* ── Infobox (from MediaWiki) ── */
.wiki-content .infobox {
  float: right;
  width: 280px;
  margin: 0 0 1rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--color-surface);
  font-size: 0.875rem;
}

.wiki-content .infobox th {
  background: var(--color-accent);
  color: white;
  text-align: center;
  font-family: var(--font-heading), serif;
}

.wiki-content .infobox td {
  padding: 0.4rem 0.6rem;
}

.wiki-content .infobox tr:nth-child(even) td {
  background: var(--color-surface-raised);
}

@media (max-width: 768px) {
  .wiki-content .infobox {
    float: none;
    width: 100%;
    margin: 0 0 1rem 0;
  }
}
```

**Step 2: Update layout.tsx with fonts**

Write `frontend/src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Libre_Caslon_Text, Outfit, JetBrains_Mono, EB_Garamond, Merriweather } from "next/font/google";
import "./globals.css";

const libreCaslonText = Libre_Caslon_Text({
  variable: "--font-libre-caslon",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Wiki Almanac — A Community Encyclopedia of Middle-earth",
    template: "%s — Wiki Almanac",
  },
  description: "A community encyclopedia of Middle-earth, powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${libreCaslonText.variable} ${outfit.variable} ${jetbrainsMono.variable} ${ebGaramond.variable} ${merriweather.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 3: Verify fonts load and terracotta colors show**
```bash
cd frontend && npm run dev
```
Visit localhost:3000. Page should have warm off-white background (#fcfbfa) and Outfit font.

**Step 4: Commit**
```bash
git add frontend/src/app/globals.css frontend/src/app/layout.tsx
git commit -m "feat: add terracotta design system with fonts and animations"
```

---

### Task 3: Create API client library

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/streamSSE.ts`

**Step 1: Create API client**

Write `frontend/src/lib/api.ts`:
```ts
const API = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Types ──

export interface WikiPage {
  pageid: number;
  title: string;
}

export interface ParsedPage {
  title: string;
  displaytitle: string;
  text: string;
  categories: { category: string }[];
  sections: { anchor: string; line: string; number: string; toclevel: number }[];
}

export interface PageExtract {
  title: string;
  extract: string;
  categories: { category: string }[];
}

export interface Category {
  category: string;
  count?: number;
}

export interface SearchResult {
  id: number;
  title: string;
  excerpt: string;
}

export interface SiteStats {
  pages: number;
  edits: number;
}

// ── API functions ──

export async function getAllPages(limit = 50): Promise<WikiPage[]> {
  return get(`/pages/?limit=${limit}`);
}

export async function getParsedPage(title: string): Promise<ParsedPage> {
  return get(`/pages/${encodeURIComponent(title)}/parsed`);
}

export async function getRelatedPages(currentTitle: string): Promise<WikiPage[]> {
  return get(`/pages/${encodeURIComponent(currentTitle)}/related`);
}

export async function getAllCategories(limit = 50): Promise<Category[]> {
  return get(`/categories/?limit=${limit}`);
}

export async function getCategoryMembers(category: string, limit = 50): Promise<WikiPage[]> {
  return get(`/categories/${encodeURIComponent(category)}/members?limit=${limit}`);
}

export async function searchPages(query: string, limit = 20): Promise<{ pages: SearchResult[] }> {
  const data = await get<{ results: SearchResult[] }>(`/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
  return { pages: data.results };
}

export async function getSiteStats(): Promise<SiteStats> {
  return get(`/site/stats`);
}

export async function getPageExtracts(titles: string[]): Promise<PageExtract[]> {
  return post(`/pages/extracts`, titles);
}
```

**Step 2: Create SSE stream helper**

Write `frontend/src/lib/streamSSE.ts`:
```ts
export interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

export async function* streamSSE(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop()!;

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split("\n");
        let data: string | null = null;
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            data = line.slice(6);
          }
        }
        if (data) {
          try {
            yield JSON.parse(data);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

**Step 3: Commit**
```bash
git add frontend/src/lib/
git commit -m "feat: add typed API client and SSE stream helper"
```

---

### Task 4: Create shared UI components (Header, GlowGrid, Footer)

**Files:**
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/SiteFooter.tsx`
- Create: `frontend/src/components/GlowGrid.tsx`
- Create: `frontend/src/components/SearchBar.tsx`

**Step 1: Create GlowGrid component**

Write `frontend/src/components/GlowGrid.tsx`:
```tsx
"use client";

import { useRef, useCallback } from "react";

interface GlowGridProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowGrid({ children, className = "" }: GlowGridProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--glow-opacity", "1");

    el.querySelectorAll<HTMLElement>("[data-glow-card]").forEach((card) => {
      const cr = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${e.clientX - cr.left}px`);
      card.style.setProperty("--spot-y", `${e.clientY - cr.top}px`);
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    ref.current?.style.setProperty("--glow-opacity", "0");
  }, []);

  return (
    <div
      ref={ref}
      className={`glow-grid ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="glow-grid__ambient" aria-hidden="true" />
      {children}
    </div>
  );
}
```

**Step 2: Create SearchBar component**

Write `frontend/src/components/SearchBar.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchPages, type SearchResult } from "@/lib/api";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleChange = useCallback((val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchPages(val.trim()).then((data) => {
        setSuggestions(data.pages || []);
        setShowSuggestions(true);
      });
    }, 200);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const pick = (title: string) => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    router.push(`/wiki/${encodeURIComponent(title)}`);
  };

  return (
    <div className="relative flex-1 max-w-md" ref={ref}>
      <form onSubmit={handleSubmit} className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint" />
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
        />
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-border bg-surface shadow-lg z-50 overflow-hidden">
          {suggestions.slice(0, 7).map((s) => (
            <button
              key={s.id}
              className="w-full text-left px-4 py-2.5 hover:bg-surface-raised transition-colors border-b border-border/40 last:border-0"
              onClick={() => pick(s.title)}
            >
              <div className="text-sm font-medium text-foreground">{s.title}</div>
              {s.excerpt && (
                <div
                  className="text-xs text-foreground-faint mt-0.5 line-clamp-1"
                  dangerouslySetInnerHTML={{ __html: s.excerpt }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create Header component**

Write `frontend/src/components/Header.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
] as const;

export function Header({
  onQuillToggle,
}: {
  onQuillToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Feather size={22} className="text-accent" />
          <span className="font-[family-name:var(--font-eb-garamond)] text-xl text-foreground tracking-tight">
            Wiki Almanac
          </span>
        </Link>

        {/* Center: Search */}
        <SearchBar />

        {/* Right: Nav + Quill */}
        <div className="flex items-center gap-5">
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors ${
                  pathname === href
                    ? "text-accent"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {onQuillToggle && (
            <button
              onClick={onQuillToggle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-accent border border-accent/30 bg-accent-faint hover:bg-accent/[0.12] hover:border-accent/40 transition-all duration-200"
            >
              <Feather size={15} />
              Quill
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
```

**Step 4: Create SiteFooter**

Write `frontend/src/components/SiteFooter.tsx`:
```tsx
import { Feather } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-20 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-foreground-faint">
        <div className="flex items-center gap-2">
          <Feather size={16} className="text-accent" />
          <span className="font-[family-name:var(--font-eb-garamond)] text-foreground-muted">
            Wiki Almanac
          </span>
          <span>·</span>
          <span>A community encyclopedia of Middle-earth</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span>Powered by MediaWiki + AI</span>
        </div>
      </div>
    </footer>
  );
}
```

**Step 5: Commit**
```bash
git add frontend/src/components/
git commit -m "feat: add Header, SearchBar, GlowGrid, and SiteFooter components"
```

---

### Task 5: Create app shell (layout with Header + Footer + Quill drawer)

**Files:**
- Modify: `frontend/src/app/layout.tsx` (add Header + Footer)
- Create: `frontend/src/components/AppShell.tsx` (client component wrapping Header + Quill)
- Create: `frontend/src/hooks/useQuillChat.ts`
- Create: `frontend/src/components/quill/QuillDrawer.tsx`
- Create: `frontend/src/components/quill/ToolCallCard.tsx`

**Step 1: Create useQuillChat hook**

Write `frontend/src/hooks/useQuillChat.ts`:
```ts
"use client";

import { useState, useRef, useCallback } from "react";
import { streamSSE } from "@/lib/streamSSE";

interface ToolPart {
  type: "tool";
  toolName: string;
  callId: string;
  args: Record<string, unknown>;
  result: string | null;
  isLoading: boolean;
}

interface TextPart {
  type: "text";
  text: string;
}

type MessagePart = TextPart | ToolPart;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
}

export function useQuillChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (prompt: string, articleTitle: string | null = null) => {
      if (!prompt.trim() || isStreaming) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        parts: [],
      };
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        parts: [],
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      try {
        abortRef.current = new AbortController();
        const response = await fetch(`/api/chat/sessions/${sessionId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, article_title: articleTitle }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        for await (const event of streamSSE(response)) {
          switch (event.type) {
            case "start":
              setSessionId(event.session_id as string);
              break;
            case "text":
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.content += event.content as string;
                const lastPart = last.parts[last.parts.length - 1];
                if (lastPart && lastPart.type === "text") {
                  last.parts = [
                    ...last.parts.slice(0, -1),
                    { ...lastPart, text: lastPart.text + (event.content as string) },
                  ];
                } else {
                  last.parts = [...last.parts, { type: "text", text: event.content as string }];
                }
                msgs[msgs.length - 1] = last;
                return msgs;
              });
              break;
            case "tool_start":
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.parts = [
                  ...last.parts,
                  {
                    type: "tool",
                    toolName: event.tool_name as string,
                    callId: event.tool_call_id as string,
                    args: (event.args as Record<string, unknown>) || {},
                    result: null,
                    isLoading: true,
                  },
                ];
                msgs[msgs.length - 1] = last;
                return msgs;
              });
              break;
            case "tool_result":
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.parts = last.parts.map((p) =>
                  p.type === "tool" && p.callId === event.tool_call_id
                    ? { ...p, result: event.result as string, isLoading: false }
                    : p
                );
                msgs[msgs.length - 1] = last;
                return msgs;
              });
              break;
            case "error":
              setError(event.message as string);
              break;
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [sessionId, isStreaming]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setError(null);
  }, []);

  return { messages, isStreaming, sessionId, error, sendMessage, stopStreaming, startNewChat };
}
```

**Step 2: Create ToolCallCard**

Write `frontend/src/components/quill/ToolCallCard.tsx`:
```tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  read_article: "Reading article",
  search_wiki: "Searching wiki",
  get_article_html: "Getting article info",
  list_category_members: "Listing category",
};

interface ToolCallCardProps {
  tool: {
    toolName: string;
    args: Record<string, unknown>;
    result: string | null;
    isLoading: boolean;
  };
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[tool.toolName] || tool.toolName;
  const argStr = tool.args ? Object.values(tool.args).join(", ") : "";

  return (
    <div className="rounded-lg border border-border/60 bg-surface-raised overflow-hidden my-2">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground-muted hover:bg-border-subtle/50 transition-colors"
        onClick={() => tool.result && setExpanded(!expanded)}
      >
        {tool.isLoading ? (
          <Loader2 size={13} className="animate-spin text-accent shrink-0" />
        ) : (
          <Check size={13} className="text-success shrink-0" />
        )}
        <span className="font-medium">{label}</span>
        {argStr && <span className="text-foreground-faint truncate">{argStr}</span>}
        {tool.result && (
          <span className="ml-auto shrink-0">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        )}
      </button>
      {expanded && tool.result && (
        <pre className="px-3 py-2 text-xs text-foreground-faint bg-surface border-t border-border/40 overflow-x-auto max-h-48 whitespace-pre-wrap">
          {tool.result}
        </pre>
      )}
    </div>
  );
}
```

**Step 3: Create QuillDrawer**

Write `frontend/src/components/quill/QuillDrawer.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Feather, X, Plus, ArrowUp, Square } from "lucide-react";
import { useQuillChat, type ChatMessage } from "@/hooks/useQuillChat";
import { ToolCallCard } from "./ToolCallCard";

const THINKING_PHRASES = [
  "Flipping through pages...",
  "Consulting the archives...",
  "Dipping the quill...",
  "Reading between the lines...",
  "Gathering ink...",
  "Pondering the margins...",
];

const SUGGESTIONS = [
  "What articles are in this wiki?",
  "Tell me about Gandalf",
  "Who are the members of the Fellowship?",
  "What happened at the Battle of Helm's Deep?",
  "Compare Mordor and The Shire",
];

function ThinkingIndicator() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * THINKING_PHRASES.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      <Feather size={16} className="animate-[quill-scribble_1.15s_ease-in-out_infinite] text-accent shrink-0" />
      <span className="text-sm text-foreground-faint italic font-[family-name:var(--font-merriweather)] animate-fade-in" key={index}>
        {THINKING_PHRASES[index]}
      </span>
    </div>
  );
}

export function QuillDrawer({
  isOpen,
  onClose,
  articleTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string | null;
}) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, startNewChat } = useQuillChat();
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!draft.trim() || isStreaming) return;
    sendMessage(draft.trim(), articleTitle);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] max-w-full z-50 flex flex-col bg-background border-l border-border shadow-2xl animate-[slideInFromRight_0.2s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Feather size={18} className="text-accent" />
          <span className="font-[family-name:var(--font-eb-garamond)] text-lg">Quill</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={startNewChat} className="p-1.5 rounded-md hover:bg-surface-raised transition-colors text-foreground-faint hover:text-foreground" title="New chat">
            <Plus size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-raised transition-colors text-foreground-faint hover:text-foreground" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="mt-8 text-center">
            <Feather size={32} className="mx-auto text-accent/40 mb-4" />
            <h3 className="font-heading text-lg mb-2">Hi! I&apos;m Quill</h3>
            <p className="text-sm text-foreground-muted mb-6">
              Your AI research assistant for Wiki Almanac.
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="w-full text-left px-4 py-2.5 rounded-lg border border-border/60 bg-surface-raised text-sm text-foreground-muted hover:text-accent hover:border-accent/30 transition-all"
                  onClick={() => sendMessage(s, articleTitle)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg: ChatMessage) => (
          <div key={msg.id} className={msg.role === "user" ? "flex justify-end animate-user-slide-in" : "animate-bubble-fade-in"}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-accent text-white text-sm">
                {msg.content}
              </div>
            ) : (
              <div className="space-y-1">
                {msg.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div key={i} className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === "tool") {
                    return <ToolCallCard key={i} tool={part} />;
                  }
                  return null;
                })}
                {isStreaming && msg === messages[messages.length - 1] && msg.parts.length === 0 && (
                  <ThinkingIndicator />
                )}
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            placeholder="Ask Quill anything..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="p-2 rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create AppShell (client wrapper)**

Write `frontend/src/components/AppShell.tsx`:
```tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { QuillDrawer } from "@/components/quill/QuillDrawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quillOpen, setQuillOpen] = useState(false);
  const pathname = usePathname();

  // Extract current article title for Quill context
  const wikiMatch = pathname.match(/^\/wiki\/(.+)/);
  const currentArticle = wikiMatch ? decodeURIComponent(wikiMatch[1]) : null;

  return (
    <>
      <Header onQuillToggle={() => setQuillOpen(!quillOpen)} />
      <main className="min-h-[calc(100dvh-140px)]">{children}</main>
      <SiteFooter />
      <QuillDrawer isOpen={quillOpen} onClose={() => setQuillOpen(false)} articleTitle={currentArticle} />
    </>
  );
}
```

**Step 5: Update layout.tsx to use AppShell**

Modify `frontend/src/app/layout.tsx` — wrap `{children}` in `<AppShell>`:
```tsx
import { AppShell } from "@/components/AppShell";
// ... existing imports and font declarations ...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${libreCaslonText.variable} ${outfit.variable} ${jetbrainsMono.variable} ${ebGaramond.variable} ${merriweather.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

**Step 6: Verify the shell renders**
```bash
cd frontend && npm run dev
```
Expected: Header with Feather icon + "Wiki Almanac", search bar, Quill button. Footer at bottom.

**Step 7: Commit**
```bash
git add frontend/src/
git commit -m "feat: add AppShell with Header, Footer, QuillDrawer, and Quill chat hook"
```

---

### Task 6: Create pages (Home, Article, Category, Search)

**Files:**
- Modify: `frontend/src/app/page.tsx` (Home)
- Create: `frontend/src/app/wiki/[title]/page.tsx` (Article)
- Create: `frontend/src/app/category/[name]/page.tsx` (Category)
- Create: `frontend/src/app/search/page.tsx` (Search)

**Step 1: Create HomePage**

Write `frontend/src/app/page.tsx`:
```tsx
import Link from "next/link";
import { Feather, BookOpen, MapPin, Gem, Scroll, Sparkles, Users, Sword, Pickaxe, Folder } from "lucide-react";
import { getAllPages, getAllCategories, getSiteStats, getPageExtracts } from "@/lib/api";
import { GlowGrid } from "@/components/GlowGrid";

const FEATURED_ARTICLES = ["Gandalf", "One Ring", "Aragorn", "Mordor", "Fellowship of the Ring"];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Characters: <Users size={20} />,
  Places: <MapPin size={20} />,
  Artifacts: <Gem size={20} />,
  Works: <BookOpen size={20} />,
  Wizards: <Sparkles size={20} />,
  Hobbits: <Users size={20} />,
  Istari: <Feather size={20} />,
  "Dúnedain": <Sword size={20} />,
  Dwarves: <Pickaxe size={20} />,
};

function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] || <Folder size={20} />;
}

export default async function HomePage() {
  const [pages, categories, stats] = await Promise.all([
    getAllPages(),
    getAllCategories(),
    getSiteStats(),
  ]);

  const pick = FEATURED_ARTICLES[Math.floor(Math.random() * FEATURED_ARTICLES.length)];
  let featured = null;
  try {
    const extracts = await getPageExtracts([pick]);
    if (extracts.length > 0) featured = extracts[0];
  } catch {
    // Silently fail
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-visible">
        <div className="mx-auto max-w-5xl px-6 pt-24 md:pt-32 pb-16 md:pb-24 text-center">
          <h1 className="font-serif text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[1] tracking-tight text-foreground mb-6 animate-fade-in-up stagger-1">
            Wiki Almanac
            <br />
            <span className="italic font-light text-foreground/80">Middle-earth encyclopedia.</span>
          </h1>

          {stats && (
            <div className="inline-flex items-center gap-6 px-5 py-2 rounded-full border border-accent/20 bg-accent/[0.04] text-sm text-accent mb-8 animate-fade-in-up stagger-2">
              <span><span className="font-mono font-semibold">{stats.pages}</span> pages</span>
              <span><span className="font-mono font-semibold">{stats.edits}</span> edits</span>
              <span><span className="font-mono font-semibold">{categories.length}</span> categories</span>
            </div>
          )}

          <p className="font-[family-name:var(--font-eb-garamond)] text-xl md:text-2xl leading-relaxed text-foreground-muted max-w-2xl mx-auto animate-fade-in-up stagger-2">
            A community encyclopedia of Middle-earth, powered by AI.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 mb-16 opacity-40">
        <div className="w-16 h-[1px] bg-border" />
        <div className="w-2 h-2 rotate-45 border border-accent" />
        <div className="w-16 h-[1px] bg-border" />
      </div>

      {/* Featured Article */}
      {featured && (
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-foreground mb-8 text-center">
            Featured Article
          </h2>
          <Link
            href={`/wiki/${encodeURIComponent(featured.title)}`}
            className="group block rounded-2xl bg-surface-raised border border-border/60 p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)]"
          >
            <h3 className="font-heading text-xl mb-3 group-hover:text-accent transition-colors">
              {featured.title}
            </h3>
            <p className="text-foreground-muted leading-relaxed mb-4 line-clamp-3">
              {featured.extract}
            </p>
            {featured.categories && (
              <div className="flex flex-wrap gap-2 mb-4">
                {featured.categories.map((c) => (
                  <span key={c.category} className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-medium tracking-wider">
                    {c.category}
                  </span>
                ))}
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-accent font-mono">
              Read full article
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </Link>
        </section>
      )}

      {/* Explore by Category */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-foreground mb-8 text-center">
          Explore by Category
        </h2>
        <GlowGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.category}
              href={`/category/${encodeURIComponent(cat.category)}`}
              data-glow-card
              className={`group flex flex-col items-center gap-3 rounded-2xl bg-surface-raised border border-border/60 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
            >
              <span className="text-foreground-faint group-hover:text-accent transition-colors">
                {getCategoryIcon(cat.category)}
              </span>
              <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors text-center">
                {cat.category}
              </span>
            </Link>
          ))}
        </GlowGrid>
      </section>

      {/* All Articles */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-foreground mb-2">
            All Articles
          </h2>
          <span className="text-sm text-foreground-faint font-mono">{pages.length} articles</span>
        </div>
        <GlowGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page, i) => (
            <Link
              key={page.pageid}
              href={`/wiki/${encodeURIComponent(page.title)}`}
              data-glow-card
              className={`group block rounded-2xl bg-surface-raised border border-border/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] animate-fade-in-up stagger-${Math.min((i % 6) + 1, 6)}`}
            >
              <h3 className="font-heading text-base group-hover:text-accent transition-colors">
                {page.title}
              </h3>
            </Link>
          ))}
        </GlowGrid>
      </section>
    </>
  );
}
```

**Step 2: Create ArticlePage**

Write `frontend/src/app/wiki/[title]/page.tsx`:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getParsedPage, getRelatedPages } from "@/lib/api";
import { ArticleContent } from "./ArticleContent";

interface Props {
  params: Promise<{ title: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { title } = await params;
  const decoded = decodeURIComponent(title);
  return { title: decoded };
}

export default async function ArticlePage({ params }: Props) {
  const { title } = await params;
  const decoded = decodeURIComponent(title);

  let page, related;
  try {
    [page, related] = await Promise.all([
      getParsedPage(decoded),
      getRelatedPages(decoded),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8">
        <article>
          {/* Category tags */}
          {page.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {page.categories.map((cat) => (
                <Link
                  key={cat.category}
                  href={`/category/${encodeURIComponent(cat.category)}`}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-medium tracking-wider hover:bg-accent/20 transition-colors"
                >
                  {cat.category}
                </Link>
              ))}
            </div>
          )}

          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-6" dangerouslySetInnerHTML={{ __html: page.displaytitle }} />

          {/* Table of Contents */}
          {page.sections.length > 1 && (
            <nav className="rounded-xl bg-surface-raised border border-border/60 p-5 mb-8">
              <h4 className="text-sm font-medium text-foreground-muted mb-3">Contents</h4>
              <ol className="space-y-1">
                {page.sections.map((s) => (
                  <li key={s.anchor} style={{ paddingLeft: `${(s.toclevel - 1) * 16}px` }}>
                    <a href={`#${s.anchor}`} className="text-sm text-foreground-faint hover:text-accent transition-colors">
                      <span className="text-foreground-faint/60 mr-1.5 font-mono text-xs">{s.number}</span>
                      {s.line}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Article body (client component for link interception) */}
          <ArticleContent html={page.text} />
        </article>

        {/* Sidebar */}
        {related.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl bg-surface-raised border border-border/60 p-5">
              <h3 className="text-sm font-medium text-foreground-muted mb-3">Related Articles</h3>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.pageid}>
                    <Link href={`/wiki/${encodeURIComponent(r.title)}`} className="text-sm text-foreground-faint hover:text-accent transition-colors">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create ArticleContent client component (for link interception)**

Write `frontend/src/app/wiki/[title]/ArticleContent.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";

export function ArticleContent({ html }: { html: string }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    const link = (e.target as HTMLElement).closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    const match = href.match(/(?:\/index\.php\/|^\.\/)(.+)/);
    if (match) {
      e.preventDefault();
      const target = decodeURIComponent(match[1].split("?")[0]);
      if (target.startsWith("Category:")) {
        router.push(`/category/${encodeURIComponent(target.replace("Category:", ""))}`);
      } else {
        router.push(`/wiki/${encodeURIComponent(target)}`);
      }
    }
  };

  return (
    <div
      className="wiki-content"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

**Step 4: Create CategoryPage**

Write `frontend/src/app/category/[name]/page.tsx`:
```tsx
import Link from "next/link";
import { getCategoryMembers } from "@/lib/api";
import { GlowGrid } from "@/components/GlowGrid";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params;
  return { title: `Category: ${decodeURIComponent(name)}` };
}

export default async function CategoryPage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const members = await getCategoryMembers(decoded);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-accent transition-colors mb-6">
        <ArrowLeft size={14} />
        Back to home
      </Link>

      <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-8">
        {decoded}
      </h1>

      {members.length === 0 ? (
        <p className="text-foreground-muted">No articles in this category.</p>
      ) : (
        <GlowGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m, i) => (
            <Link
              key={m.pageid}
              href={`/wiki/${encodeURIComponent(m.title)}`}
              data-glow-card
              className={`group block rounded-2xl bg-surface-raised border border-border/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] animate-fade-in-up stagger-${Math.min((i % 6) + 1, 6)}`}
            >
              <h3 className="font-heading text-base group-hover:text-accent transition-colors">
                {m.title}
              </h3>
            </Link>
          ))}
        </GlowGrid>
      )}
    </div>
  );
}
```

**Step 5: Create SearchPage**

Write `frontend/src/app/search/page.tsx`:
```tsx
import { Suspense } from "react";
import { SearchResults } from "./SearchResults";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Suspense fallback={<p className="text-foreground-muted">Loading...</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
```

Write `frontend/src/app/search/SearchResults.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { searchPages, type SearchResult } from "@/lib/api";

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    searchPages(query)
      .then((data) => setResults(data.pages || []))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <>
      <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-8">
        Search results for &ldquo;{query}&rdquo;
      </h1>
      {loading && <p className="text-foreground-muted">Searching...</p>}
      {!loading && results.length === 0 && query && (
        <p className="text-foreground-muted">No results found.</p>
      )}
      <div className="space-y-3">
        {results.map((r) => (
          <Link
            key={r.id}
            href={`/wiki/${encodeURIComponent(r.title)}`}
            className="group block rounded-xl bg-surface-raised border border-border/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)]"
          >
            <h3 className="font-heading text-base mb-1 group-hover:text-accent transition-colors">
              {r.title}
            </h3>
            <p
              className="text-sm text-foreground-faint line-clamp-2"
              dangerouslySetInnerHTML={{ __html: r.excerpt }}
            />
          </Link>
        ))}
      </div>
    </>
  );
}
```

**Step 6: Delete default Next.js page content**

Remove the default `page.tsx` content that create-next-app generated (we replaced it in Step 1).

**Step 7: Verify all routes work**
```bash
cd frontend && npm run dev
```
Test: `/`, `/wiki/Gandalf`, `/category/Characters`, `/search?q=ring`

**Step 8: Commit**
```bash
git add frontend/src/
git commit -m "feat: add all pages — Home, Article, Category, Search with terracotta aesthetic"
```

---

### Task 7: Add slideInFromRight animation + clean up

**Files:**
- Modify: `frontend/src/app/globals.css`

**Step 1: Add missing animation**

Add to globals.css animations section:
```css
@keyframes slideInFromRight {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
```

**Step 2: Run build to verify no errors**
```bash
cd frontend && npm run build
```
Expected: Build succeeds with no errors.

**Step 3: Commit**
```bash
git add frontend/
git commit -m "feat: complete Next.js + terracotta migration"
```

---

### Task 8: Update Makefile and project configuration

**Files:**
- Modify: `Makefile` (update frontend commands from vite to next)

**Step 1: Check current Makefile frontend targets and update**

The Makefile likely has targets referencing Vite. Update them to use Next.js commands:
- `npm run dev` still works (Next.js uses the same script name)
- `npm run build` still works
- Port may change from 5173 to 3000

**Step 2: Commit**
```bash
git add Makefile
git commit -m "chore: update Makefile for Next.js frontend"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Scaffold Next.js + install deps | `frontend/` (new) |
| 2 | Terracotta design system | `globals.css`, `layout.tsx` |
| 3 | API client library | `lib/api.ts`, `lib/streamSSE.ts` |
| 4 | Shared components | Header, SearchBar, GlowGrid, Footer |
| 5 | App shell + Quill drawer | AppShell, QuillDrawer, ToolCallCard, useQuillChat |
| 6 | All pages | Home, Article, Category, Search |
| 7 | Animation cleanup + build verify | `globals.css` |
| 8 | Makefile update | `Makefile` |

**Key design elements ported from OpenAlmanac:**
- Terracotta accent `#b35922` with warm off-white `#fcfbfa` background
- Libre Caslon Text / Merriweather / Outfit / EB Garamond / JetBrains Mono fonts
- Lucide React icons (`Feather` for Quill branding)
- GlowGrid cursor-following card glow effect
- Rounded-2xl cards with hover lift + terracotta shadow
- Staggered fade-in animations
- Quill AI drawer with scribble animation + thinking phrases
