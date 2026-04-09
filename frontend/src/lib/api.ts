export interface WikiPage {
  pageid: number;
  title: string;
}

export interface ParsedPage {
  title: string;
  displaytitle: string;
  text: string;
  categories: { category: string }[];
  sections: {
    anchor: string;
    line: string;
    number: string;
    toclevel: number;
  }[];
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

// Server components need absolute URL; client components use relative (proxied by Next.js rewrites)
const isServer = typeof window === "undefined";
const BASE = isServer ? "http://127.0.0.1:8000/api" : "/api";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Pages ──

export async function getAllPages(limit = 50): Promise<WikiPage[]> {
  return fetchJSON<WikiPage[]>(`/pages/?limit=${limit}`);
}

export async function getParsedPage(title: string): Promise<ParsedPage> {
  return fetchJSON<ParsedPage>(`/pages/${encodeURIComponent(title)}/parsed`);
}

export async function getRelatedPages(currentTitle: string): Promise<WikiPage[]> {
  return fetchJSON<WikiPage[]>(`/pages/${encodeURIComponent(currentTitle)}/related`);
}

export async function getPageExtracts(titles: string[]): Promise<PageExtract[]> {
  return postJSON<PageExtract[]>(`/pages/extracts`, titles);
}

// ── Categories ──

export async function getAllCategories(limit = 50): Promise<Category[]> {
  return fetchJSON<Category[]>(`/categories/?limit=${limit}`);
}

export async function getCategoryMembers(category: string, limit = 50): Promise<WikiPage[]> {
  return fetchJSON<WikiPage[]>(
    `/categories/${encodeURIComponent(category)}/members?limit=${limit}`
  );
}

// ── Search ──

export async function searchPages(
  query: string,
  limit = 20
): Promise<{ pages: SearchResult[] }> {
  const data = await fetchJSON<{ results: SearchResult[] }>(
    `/search/?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return { pages: data.results };
}

// ── Site ──

export async function getSiteStats(): Promise<SiteStats> {
  return fetchJSON<SiteStats>(`/site/stats`);
}

// ── Editor ──

export interface PageSource {
  id: number;
  key: string;
  title: string;
  source: string;
  content_model: string;
  latest_revision_id: number;
  latest_timestamp: string;
}

export interface EditResponse {
  result: string;
  pageid: number;
  title: string;
  oldrevid: number;
  newrevid: number;
}

export async function getPageSource(title: string): Promise<PageSource> {
  return fetchJSON<PageSource>(`/pages/${encodeURIComponent(title)}/source`);
}

export async function editPage(title: string, content: string, summary = ""): Promise<EditResponse> {
  return postJSON<EditResponse>(`/pages/${encodeURIComponent(title)}/edit`, { title, content, summary });
}

export async function previewWikitext(content: string): Promise<string> {
  const data = await postJSON<{ html: string }>(`/pages/preview`, { title: "", content });
  return data.html;
}
