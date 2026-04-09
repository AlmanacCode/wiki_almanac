import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategoryMembers } from "../api";

export default function CategoryPage() {
  const { name } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCategoryMembers(decodeURIComponent(name))
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="category-page">
      <h1>Category: {decodeURIComponent(name)}</h1>
      {members.length === 0 ? (
        <p>No articles in this category.</p>
      ) : (
        <div className="page-grid">
          {members.map((m) => (
            <Link key={m.pageid} to={`/wiki/${encodeURIComponent(m.title)}`} className="page-card">
              <h3>{m.title}</h3>
            </Link>
          ))}
        </div>
      )}
      <Link to="/" className="back-link">&larr; Back to home</Link>
    </div>
  );
}
