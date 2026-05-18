import { Globe, Loader2, Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/translator";
import { languageByCode } from "@/lib/i18n/languages";

type Props = {
  variant?: "icon" | "compact";
  className?: string;
};

export function LanguageSwitcher({ variant = "icon", className = "" }: Props) {
  const { lang, setLang, languages, translating, detected } = useTranslation();
  const [query, setQuery] = useState("");

  const current = languageByCode(lang);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? languages.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.native.toLowerCase().includes(q) ||
            l.code.toLowerCase().includes(q),
        )
      : languages;
    const map = new Map<string, typeof languages>();
    filtered.forEach((l) => {
      if (!map.has(l.region)) map.set(l.region, []);
      map.get(l.region)!.push(l);
    });
    return Array.from(map.entries());
  }, [languages, query]);

  return (
    <div data-no-translate className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={`Language: ${current?.name ?? lang}`}
            aria-label="Change language"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background/40 px-2.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            {translating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {variant === "compact" ? (
              <span className="uppercase tracking-wider">{lang.split("-")[0]}</span>
            ) : (
              <>
                <span aria-hidden>{current?.flag ?? "🌐"}</span>
                <span className="hidden sm:inline">{current?.native ?? "Language"}</span>
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 max-h-[70vh] overflow-y-auto p-0"
        >
          <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search languages…"
                className="h-8 w-full rounded-md border border-border bg-background/60 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {detected && detected !== lang && (
              <button
                type="button"
                onClick={() => setLang(detected)}
                className="mt-2 w-full rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/20"
              >
                Detected: {languageByCode(detected)?.native ?? detected} — use this
              </button>
            )}
          </div>
          <div className="py-1">
            {grouped.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</p>
            )}
            {grouped.map(([region, items]) => (
              <div key={region} className="px-1 py-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {region}
                </p>
                {items.map((l) => {
                  const active = l.code === lang;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLang(l.code)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-foreground hover:bg-accent/60"
                      }`}
                    >
                      <span aria-hidden className="text-base leading-none">{l.flag}</span>
                      <span className="flex-1 truncate">
                        <span className="font-medium">{l.native}</span>
                        <span className="ml-1.5 text-muted-foreground">{l.name}</span>
                      </span>
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}