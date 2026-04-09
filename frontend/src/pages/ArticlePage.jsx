import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getParsedPage, getRelatedPages } from "../api";

export default function ArticlePage() {
  const { title } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tocOpen, setTocOpen] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setRelated([]);
    const decoded = decodeURIComponent(title);
    Promise.all([
      getParsedPage(decoded),
      getRelatedPages(null, decoded),
    ])
      .then(([p, rel]) => { setPage(p); setRelated(rel); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [title]);

  const handleContentClick = (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    const match = href.match(/(?:\/index\.php\/|^\.\/)(.+)/);
    if (match) {
      e.preventDefault();
      const target = decodeURIComponent(match[1].split("?")[0]);
      if (target.startsWith("Category:")) {
        navigate(`/category/${encodeURIComponent(target.replace("Category:", ""))}`);
      } else {
        navigate(`/wiki/${encodeURIComponent(target)}`);
      }
    }
  };

  if (loading) return <div className="loading-screen">Loading article...</div>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="article-layout">
      <article className="article">
        {/* Category strip at top */}
        {page.categories.length > 0 && (
          <div className="article-categories-top">
            {page.categories.map((cat) => (
              <Link key={cat.category} to={`/category/${encodeURIComponent(cat.category)}`} className="category-tag small">
                {cat.category}
              </Link>
            ))}
          </div>
        )}

        <h1 dangerouslySetInnerHTML={{ __html: page.displaytitle }} />

        {/* Table of Contents */}
        {page.sections.length > 1 && (
          <nav className="toc">
            <div className="toc-header" onClick={() => setTocOpen(!tocOpen)}>
              <h4>Contents</h4>
              <span className="toc-toggle">{tocOpen ? "▲" : "▼"}</span>
            </div>
            {tocOpen && (
              <ol className="toc-list">
                {page.sections.map((s) => (
                  <li key={s.anchor} className={`toc-level-${s.toclevel}`}>
                    <a href={`#${s.anchor}`}>
                      <span className="toc-number">{s.number}</span>
                      {s.line}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </nav>
        )}

        <div
          className="wiki-content"
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: page.text }}
        />

        {/* Bottom categories */}
        {page.categories.length > 0 && (
          <div className="article-categories">
            <span>Categories: </span>
            {page.categories.map((cat) => (
              <Link key={cat.category} to={`/category/${encodeURIComponent(cat.category)}`} className="category-tag">
                {cat.category}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Sidebar: Related Articles */}
      {related.length > 0 && (
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Related Articles</h3>
            <ul className="related-list">
              {related.map(r => (
                <li key={r.pageid}>
                  <Link to={`/wiki/${encodeURIComponent(r.title)}`}>{r.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}
