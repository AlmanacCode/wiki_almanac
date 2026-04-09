import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getAllCategories, getCategoryMembers, searchPages } from "../api";
import QuillDrawer from "./quill/QuillDrawer";

export default function Layout() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryMembers, setCategoryMembers] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [quillOpen, setQuillOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef();
  const searchRef = useRef();
  const debounceRef = useRef();

  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Load members when a dropdown opens
  useEffect(() => {
    if (openDropdown && !categoryMembers[openDropdown]) {
      getCategoryMembers(openDropdown).then(members => {
        setCategoryMembers(prev => ({ ...prev, [openDropdown]: members }));
      });
    }
  }, [openDropdown]);

  // Close dropdown/suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Search autocomplete
  const handleQueryChange = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      searchPages(val.trim()).then(data => {
        setSuggestions(data.pages || []);
        setShowSuggestions(true);
      });
    }, 200);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const pickSuggestion = (title) => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/wiki/${encodeURIComponent(title)}`);
  };

  // Current article title (for Quill context)
  const wikiMatch = location.pathname.match(/^\/wiki\/(.+)/);
  const currentArticle = wikiMatch ? decodeURIComponent(wikiMatch[1]) : null;

  // Breadcrumbs
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <Link to="/" className="logo">Wiki Almanac</Link>
          <div className="search-wrapper" ref={searchRef}>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search articles..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              <button type="submit">Search</button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.slice(0, 7).map(s => (
                  <button key={s.id} className="suggestion-item" onClick={() => pickSuggestion(s.title)}>
                    <span className="suggestion-title">{s.title}</span>
                    {s.excerpt && <span className="suggestion-excerpt" dangerouslySetInnerHTML={{ __html: s.excerpt }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="quill-toggle" onClick={() => setQuillOpen(!quillOpen)} title="Open Quill AI">
            ✍️ Quill
          </button>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle dark mode">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
        <nav className="cat-nav" ref={navRef}>
          <Link to="/" className="nav-link">Home</Link>
          {categories.map((cat) => (
            <div key={cat.category} className="nav-dropdown">
              <button
                className={`nav-link ${openDropdown === cat.category ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === cat.category ? null : cat.category);
                }}
              >
                {cat.category}
                <span className="chevron">&#9662;</span>
              </button>
              {openDropdown === cat.category && (
                <div className="dropdown-menu">
                  <Link
                    to={`/category/${encodeURIComponent(cat.category)}`}
                    className="dropdown-header"
                    onClick={() => setOpenDropdown(null)}
                  >
                    All {cat.category} &rarr;
                  </Link>
                  {(categoryMembers[cat.category] || []).map(m => (
                    <Link
                      key={m.pageid}
                      to={`/wiki/${encodeURIComponent(m.title)}`}
                      className="dropdown-item"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {m.title}
                    </Link>
                  ))}
                  {!categoryMembers[cat.category] && (
                    <span className="dropdown-item loading">Loading...</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </header>
      {breadcrumbs.length > 0 && (
        <div className="breadcrumbs-bar">
          <div className="breadcrumbs">
            <Link to="/">Home</Link>
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                <span className="bc-sep">/</span>
                {b.link ? <Link to={b.link}>{b.label}</Link> : <span>{b.label}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      <main>
        <Outlet />
      </main>
      <QuillDrawer isOpen={quillOpen} onClose={() => setQuillOpen(false)} articleTitle={currentArticle} />
    </div>
  );
}

function buildBreadcrumbs(pathname) {
  const crumbs = [];
  const wikiMatch = pathname.match(/^\/wiki\/(.+)/);
  if (wikiMatch) {
    crumbs.push({ label: decodeURIComponent(wikiMatch[1]), link: null });
  }
  const catMatch = pathname.match(/^\/category\/(.+)/);
  if (catMatch) {
    crumbs.push({ label: `Category: ${decodeURIComponent(catMatch[1])}`, link: null });
  }
  if (pathname === "/search") {
    crumbs.push({ label: "Search", link: null });
  }
  return crumbs;
}
