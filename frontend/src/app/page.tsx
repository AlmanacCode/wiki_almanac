import Link from "next/link";
import { Feather, Users, MapPin, Gem, BookOpen, Sparkles, Sword, Pickaxe } from "lucide-react";
import { getAllPages, getAllCategories, getSiteStats } from "@/lib/api";
import { GlowGrid } from "@/components/GlowGrid";

const FEATURED_ARTICLES = [
  "Gandalf",
  "Aragorn",
  "The One Ring",
  "Minas Tirith",
  "Rivendell",
  "Sauron",
  "Frodo Baggins",
  "Rohan",
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Characters: <Users className="w-5 h-5" />,
  Places: <MapPin className="w-5 h-5" />,
  Artifacts: <Gem className="w-5 h-5" />,
  Works: <BookOpen className="w-5 h-5" />,
  Wizards: <Sparkles className="w-5 h-5" />,
  Hobbits: <Users className="w-5 h-5" />,
  Istari: <Feather className="w-5 h-5" />,
  "Dúnedain": <Sword className="w-5 h-5" />,
  Dwarves: <Pickaxe className="w-5 h-5" />,
};

function getCategoryIcon(name: string) {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return <BookOpen className="w-5 h-5" />;
}

export default async function HomePage() {
  let pages: Awaited<ReturnType<typeof getAllPages>> = [];
  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  let stats: Awaited<ReturnType<typeof getSiteStats>> = { pages: 0, edits: 0 };
  try {
    [pages, categories, stats] = await Promise.all([
      getAllPages(50),
      getAllCategories(20),
      getSiteStats(),
    ]);
  } catch {
    // keep defaults
  }

  const featuredTitle =
    FEATURED_ARTICLES[Math.floor(Math.random() * FEATURED_ARTICLES.length)];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero */}
      <section className="py-16 sm:py-20 text-center animate-fade-in-up">
        <p className="text-xs uppercase tracking-[0.25em] text-accent font-mono mb-4">
          A Community Encyclopedia
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
          The Lord of the Rings
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-foreground-muted font-[family-name:var(--font-eb-garamond)] max-w-2xl mx-auto">
          Explore the peoples, places, and legends of Middle-earth.
          <br className="hidden sm:block" />
          Every article sourced from Tolkien&apos;s works.
        </p>
        <div className="mt-8 inline-flex items-center gap-6 px-5 py-2.5 rounded-full border border-accent/20 bg-accent/[0.04] text-sm text-accent">
          <span>
            <span className="font-mono font-semibold">{stats.pages}</span> articles
          </span>
          <span className="w-1 h-1 rounded-full bg-accent/40" />
          <span>
            <span className="font-mono font-semibold">{stats.edits}</span> edits
          </span>
          <span className="w-1 h-1 rounded-full bg-accent/40" />
          <span>
            <span className="font-mono font-semibold">{categories.length}</span> categories
          </span>
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 mb-12 opacity-40">
        <div className="w-16 h-[1px] bg-border" />
        <div className="w-2 h-2 rotate-45 border border-accent" />
        <div className="w-16 h-[1px] bg-border" />
      </div>

      {/* Featured Article */}
      <section className="pb-10 animate-fade-in-up stagger-1">
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
          Featured Article
        </h2>
        <Link
          href={`/wiki/${encodeURIComponent(featuredTitle)}`}
          className="group block rounded-2xl bg-surface-raised border border-border/60 p-6 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] transition-all"
        >
          <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
            {featuredTitle}
          </h3>
          <p className="mt-2 text-sm text-foreground-muted">
            Explore this article from the Wiki Almanac collection.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent font-medium">
            Read more
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </Link>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="pb-10 animate-fade-in-up stagger-2">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
            Explore by Category
          </h2>
          <GlowGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.category}
                href={`/category/${encodeURIComponent(cat.category)}`}
                data-glow-card
                className="group relative rounded-2xl bg-surface-raised border border-border/60 p-5 flex flex-col items-center gap-3 text-center hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] transition-all"
              >
                <span className="text-foreground-faint group-hover:text-accent transition-colors">
                  {getCategoryIcon(cat.category)}
                </span>
                <span className="font-heading text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  {cat.category}
                </span>
                {cat.count != null && (
                  <span className="text-xs text-foreground-faint">
                    {cat.count} articles
                  </span>
                )}
              </Link>
            ))}
          </GlowGrid>
        </section>
      )}

      {/* All Articles */}
      {pages.length > 0 && (
        <section className="pb-16 animate-fade-in-up stagger-3">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              All Articles
            </h2>
            <span className="text-xs text-foreground-faint font-mono">
              {pages.length} articles
            </span>
          </div>
          <GlowGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <Link
                key={page.pageid}
                href={`/wiki/${encodeURIComponent(page.title)}`}
                data-glow-card
                className="group relative rounded-2xl bg-surface-raised border border-border/60 p-5 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] transition-all"
              >
                <h3 className="font-heading text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  {page.title}
                </h3>
              </Link>
            ))}
          </GlowGrid>
        </section>
      )}
    </div>
  );
}
