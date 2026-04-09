"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function ArticleContent({ html }: { html: string }) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      // Use the anchor's pathname/search which the browser has already resolved
      const pathname = anchor.pathname;
      const search = anchor.search;

      // /index.php/Title
      const pathMatch = pathname.match(/\/index\.php\/(.+)/);
      if (pathMatch) {
        e.preventDefault();
        const raw = decodeURIComponent(pathMatch[1]);
        if (raw.startsWith("Category:")) {
          router.push(`/category/${encodeURIComponent(raw.replace("Category:", ""))}`);
        } else {
          router.push(`/wiki/${encodeURIComponent(raw)}`);
        }
        return;
      }

      // /index.php?title=Title&action=edit...
      if (pathname.endsWith("/index.php") && search) {
        const params = new URLSearchParams(search);
        const title = params.get("title");
        if (title) {
          e.preventDefault();
          if (title.startsWith("Category:")) {
            router.push(`/category/${encodeURIComponent(title.replace("Category:", ""))}`);
          } else {
            router.push(`/wiki/${encodeURIComponent(title)}`);
          }
          return;
        }
      }
    },
    [router]
  );

  return (
    <div
      className="wiki-content"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
