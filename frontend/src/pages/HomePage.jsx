import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPages, getAllCategories, getSiteStats, getPageExtracts } from "../api";

const FEATURED_ARTICLES = ["Gandalf", "One Ring", "Aragorn", "Mordor", "Fellowship of the Ring"];

export default function HomePage() {
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllPages(), getAllCategories(), getSiteStats()])
      .then(([p, c, s]) => {
        setPages(p);
        setCategories(c);
        setStats(s);
        // Pick a random featured article
        const pick = FEATURED_ARTICLES[Math.floor(Math.random() * FEATURED_ARTICLES.length)];
        return getPageExtracts([pick]);
      })
      .then(extracts => {
        if (extracts && extracts.length > 0) {
          setFeatured(extracts[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading Wiki Almanac...</div>;

  return (
    <div className="home">
      {/* Hero / Welcome */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Wiki Almanac</h1>
          <p className="hero-subtitle">A community encyclopedia of Middle-earth</p>
          {stats && (
            <div className="stats-bar">
              <div className="stat"><span className="stat-num">{stats.pages}</span> pages</div>
              <div className="stat"><span className="stat-num">{stats.edits}</span> edits</div>
              <div className="stat"><span className="stat-num">{categories.length}</span> categories</div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Article */}
      {featured && (
        <section className="featured-section">
          <div className="section-header">
            <h2>Featured Article</h2>
          </div>
          <div className="featured-card">
            <div className="featured-body">
              <h3>
                <Link to={`/wiki/${encodeURIComponent(featured.title)}`}>{featured.title}</Link>
              </h3>
              <p>{featured.extract}</p>
              {featured.categories && (
                <div className="featured-cats">
                  {featured.categories.map(c => (
                    <Link key={c.category} to={`/category/${encodeURIComponent(c.category)}`} className="category-tag small">
                      {c.category}
                    </Link>
                  ))}
                </div>
              )}
              <Link to={`/wiki/${encodeURIComponent(featured.title)}`} className="read-more">
                Read full article &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Portal links */}
      <section className="portals-section">
        <div className="section-header">
          <h2>Explore by Category</h2>
        </div>
        <div className="portal-grid">
          {categories.map((cat) => (
            <Link key={cat.category} to={`/category/${encodeURIComponent(cat.category)}`} className="portal-card">
              <span className="portal-icon">{getCategoryIcon(cat.category)}</span>
              <span className="portal-name">{cat.category}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* All Articles */}
      <section>
        <div className="section-header">
          <h2>All Articles</h2>
          <span className="article-count">{pages.length} articles</span>
        </div>
        <div className="page-grid">
          {pages.map((page) => (
            <Link key={page.pageid} to={`/wiki/${encodeURIComponent(page.title)}`} className="page-card">
              <h3>{page.title}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function getCategoryIcon(name) {
  const icons = {
    Characters: "\u{1F9D9}",
    Places: "\u{1F3F0}",
    Artifacts: "\u{1F48D}",
    Works: "\u{1F4D6}",
    Wizards: "\u{2728}",
    Hobbits: "\u{1F9D1}",
    Istari: "\u{1FA84}",
    "D\u00FAnedain": "\u{2694}\uFE0F",
    Dwarves: "\u{26CF}\uFE0F",
  };
  return icons[name] || "\u{1F4C2}";
}
