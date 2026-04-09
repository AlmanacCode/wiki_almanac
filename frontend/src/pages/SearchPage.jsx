import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchPages } from "../api";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    searchPages(query)
      .then((data) => setResults(data.pages || []))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="search-page">
      <h1>Search results for "{query}"</h1>
      {loading && <p>Searching...</p>}
      {!loading && results.length === 0 && query && <p>No results found.</p>}
      <div className="search-results">
        {results.map((r) => (
          <Link key={r.id} to={`/wiki/${encodeURIComponent(r.title)}`} className="search-result">
            <h3>{r.title}</h3>
            <p dangerouslySetInnerHTML={{ __html: r.excerpt }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
