"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/api";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.pages ?? []);
        setOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelect = (title: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/wiki/${encodeURIComponent(title)}`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-surface-raised border border-border/60 text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
        />
      </form>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.title)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-raised transition-colors border-b border-border-subtle last:border-0"
            >
              <span className="font-medium text-foreground">{s.title}</span>
              {s.excerpt && (
                <span
                  className="block text-xs text-foreground-faint mt-0.5 line-clamp-1"
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
