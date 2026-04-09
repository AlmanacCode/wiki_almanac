"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/api";

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.pages ?? []);
        setSearched(true);
      })
      .catch(() => {
        setResults([]);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="text-center py-16 text-foreground-faint">
        <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>Enter a search term to find articles.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-20 w-full" />
        ))}
      </div>
    );
  }

  if (searched && results.length === 0) {
    return (
      <div className="text-center py-16 text-foreground-faint">
        <p>No results found for &ldquo;{query}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground-faint mb-4">
        {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
      </p>
      {results.map((r) => (
        <Link
          key={r.id}
          href={`/wiki/${encodeURIComponent(r.title)}`}
          className="block rounded-2xl bg-surface-raised border border-border/60 p-5 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] transition-all"
        >
          <h3 className="font-heading text-base font-medium text-foreground">
            {r.title}
          </h3>
          {r.excerpt && (
            <p
              className="mt-1.5 text-sm text-foreground-muted line-clamp-2"
              dangerouslySetInnerHTML={{ __html: r.excerpt }}
            />
          )}
        </Link>
      ))}
    </div>
  );
}
