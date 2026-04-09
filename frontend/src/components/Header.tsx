"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Feather, Home, Search, ChevronDown } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { getAllCategories, getCategoryMembers, type Category, type WikiPage } from "@/lib/api";

export function Header({
  onToggleQuill,
  quillOpen,
}: {
  onToggleQuill: () => void;
  quillOpen: boolean;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [memberCache, setMemberCache] = useState<Record<string, WikiPage[]>>({});
  const navRef = useRef<HTMLElement>(null);

  // Load categories on mount
  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => {});
  }, []);

  // Lazy-load members when dropdown opens
  useEffect(() => {
    if (openDropdown && !memberCache[openDropdown]) {
      getCategoryMembers(openDropdown).then((members) => {
        setMemberCache((prev) => ({ ...prev, [openDropdown]: members }));
      });
    }
  }, [openDropdown, memberCache]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const toggleDropdown = useCallback((cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === cat ? null : cat));
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Feather className="w-5 h-5 text-accent" />
          <span className="text-lg font-semibold font-[family-name:var(--font-eb-garamond)] text-foreground">
            Wiki Almanac
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground rounded-lg hover:bg-surface-raised transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground rounded-lg hover:bg-surface-raised transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <button
            onClick={onToggleQuill}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              quillOpen
                ? "bg-accent text-white"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
            }`}
          >
            <Feather className="w-4 h-4" />
            <span className="hidden sm:inline">Quill</span>
          </button>
        </nav>
      </div>

      {/* Category navigation bar */}
      {categories.length > 0 && (
        <nav
          ref={navRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-1.5 flex-wrap border-t border-border/40"
        >
          <Link
            href="/"
            className="shrink-0 px-3 py-1 text-sm text-foreground-muted hover:text-accent transition-colors"
          >
            Home
          </Link>
          {categories.map((cat) => (
            <div key={cat.category} className="relative shrink-0">
              <button
                onClick={(e) => toggleDropdown(cat.category, e)}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
                  openDropdown === cat.category
                    ? "text-accent bg-accent-faint"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-raised"
                }`}
              >
                {cat.category}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    openDropdown === cat.category ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === cat.category && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-surface shadow-lg z-50 py-1 animate-fade-in">
                  {/* "All Category →" header link */}
                  <Link
                    href={`/category/${encodeURIComponent(cat.category)}`}
                    className="block px-4 py-2 text-sm font-medium text-accent hover:bg-surface-raised transition-colors border-b border-border/40"
                    onClick={() => setOpenDropdown(null)}
                  >
                    All {cat.category} →
                  </Link>

                  {/* Members */}
                  {memberCache[cat.category] ? (
                    memberCache[cat.category].map((m) => (
                      <Link
                        key={m.pageid}
                        href={`/wiki/${encodeURIComponent(m.title)}`}
                        className="block px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {m.title}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-foreground-faint">
                      Loading...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
