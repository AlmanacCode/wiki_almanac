import { Feather } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-foreground-faint">
          <Feather className="w-4 h-4" />
          <span className="font-[family-name:var(--font-eb-garamond)] text-sm">
            Wiki Almanac
          </span>
        </div>
        <p className="text-xs text-foreground-faint">
          A Middle-earth encyclopedia powered by MediaWiki
        </p>
      </div>
    </footer>
  );
}
