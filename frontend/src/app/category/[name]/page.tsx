import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCategoryMembers } from "@/lib/api";
import { GlowGrid } from "@/components/GlowGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  return { title: `Category: ${decodeURIComponent(name)}` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  let members: Awaited<ReturnType<typeof getCategoryMembers>>;
  try {
    members = await getCategoryMembers(decoded, 100);
  } catch {
    members = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <h1 className="font-serif text-3xl font-bold text-foreground mb-8">
        {decoded}
      </h1>

      {members.length === 0 ? (
        <p className="text-foreground-muted">No articles found in this category.</p>
      ) : (
        <GlowGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((page) => (
            <Link
              key={page.pageid}
              href={`/wiki/${encodeURIComponent(page.title)}`}
              data-glow-card
              className="relative rounded-2xl bg-surface-raised border border-border/60 p-5 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_8px_30px_rgba(179,89,34,0.06)] transition-all"
            >
              <h3 className="font-heading text-sm font-medium text-foreground">
                {page.title}
              </h3>
            </Link>
          ))}
        </GlowGrid>
      )}
    </div>
  );
}
