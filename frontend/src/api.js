// All requests go through our FastAPI backend at /api/...
// Vite proxies /api → http://127.0.0.1:8000/api

const API = "/api";

async function get(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function post(path, body) {
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

// ── Pages ──

export async function getAllPages(limit = 50) {
  return get(`/pages/?limit=${limit}`);
}

export async function getParsedPage(title) {
  return get(`/pages/${encodeURIComponent(title)}/parsed`);
}

export async function getPageSource(title) {
  return get(`/pages/${encodeURIComponent(title)}/source`);
}

export async function getPageHistory(title, limit = 20) {
  return get(`/pages/${encodeURIComponent(title)}/history?limit=${limit}`);
}

export async function getRandomPage() {
  return get(`/pages/random`);
}

export async function getPageExtracts(titles) {
  return post(`/pages/extracts`, titles);
}

export async function getRelatedPages(categories, currentTitle) {
  // Uses the backend endpoint which handles category lookup internally
  return get(`/pages/${encodeURIComponent(currentTitle)}/related`);
}

// ── Categories ──

export async function getAllCategories(limit = 50) {
  return get(`/categories/?limit=${limit}`);
}

export async function getCategoryMembers(category, limit = 50) {
  return get(`/categories/${encodeURIComponent(category)}/members?limit=${limit}`);
}

// ── Search ──

export async function searchPages(query, limit = 20) {
  const data = await get(`/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
  // Return in the shape the frontend expects ({ pages: [...] })
  return { pages: data.results };
}

// ── Site ──

export async function getSiteStats() {
  return get(`/site/stats`);
}
