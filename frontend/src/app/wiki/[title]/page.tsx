import type { Metadata } from "next";
import Link from "next/link";
import { getParsedPage, getRelatedPages } from "@/lib/api";
import { ArticleContent } from "./ArticleContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ title: string }>;
}): Promise<Metadata> {
  const { title } = await params;
  const decoded = decodeURIComponent(title);
  return { title: decoded };
}

export default async function WikiPage({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params;
  const decoded = decodeURIComponent(title);

  let page, related;
  try {
    [page, related] = await Promise.all([
      getParsedPage(decoded),
      getRelatedPages(decoded).catch(() => []),
    ]);
  } catch {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
          Page not found
        </h1>
        <p className="text-foreground-muted mb-6">
          The article &ldquo;{decoded}&rdquo; could not be loaded.
        </p>
        <Link href="/" className="text-accent hover:text-accent-hover">
          &larr; Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex gap-8">
        {/* Main content */}
        <article className="flex-1 min-w-0">
          {/* Category tags */}
          {page.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {page.categories.map((cat) => (
                <Link
                  key={cat.category}
                  href={`/category/${encodeURIComponent(cat.category)}`}
                  className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-accent-faint text-accent hover:bg-accent-glow transition-colors"
                >
                  {cat.category}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6"
            dangerouslySetInnerHTML={{ __html: page.displaytitle || decoded }}
          />

          {/* Table of Contents */}
          {page.sections.length > 0 && (
            <nav className="mb-8 rounded-2xl bg-surface-raised border border-border/60 p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-3">
                Contents
              </h2>
              <ol className="space-y-1">
                {page.sections.map((sec) => (
                  <li
                    key={sec.anchor}
                    style={{ paddingLeft: `${(sec.toclevel - 1) * 16}px` }}
                  >
                    <a
                      href={`#${sec.anchor}`}
                      className="text-sm text-accent hover:text-accent-hover transition-colors"
                    >
                      <span className="text-foreground-faint mr-2">{sec.number}</span>
                      {sec.line}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Article body */}
          <ArticleContent html={page.text} />
        </article>

        {/* Sidebar */}
        {related.length > 0 && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                Related Articles
              </h3>
              <div className="space-y-2">
                {related.map((r) => (
                  <Link
                    key={r.pageid}
                    href={`/wiki/${encodeURIComponent(r.title)}`}
                    className="block rounded-xl bg-surface-raised border border-border/60 px-4 py-3 text-sm font-medium text-foreground hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] transition-all"
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
