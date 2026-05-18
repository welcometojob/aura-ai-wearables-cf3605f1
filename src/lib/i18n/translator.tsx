import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_TO_LANG, LANGUAGES, languageByCode, type Language } from "./languages";

type Ctx = {
  lang: string;
  setLang: (code: string) => void;
  languages: Language[];
  translating: boolean;
  detected: string | null;
};

const TranslationContext = createContext<Ctx | null>(null);

const STORAGE_LANG = "tm.lang";
const STORAGE_CACHE_PREFIX = "tm.t."; // tm.t.<lang> => { [text]: translated }
const ATTR_ORIGINAL = "data-i18n-original";

function loadCache(lang: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_CACHE_PREFIX + lang);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveCache(lang: string, cache: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    // Prevent unbounded growth (cap ~5000 entries)
    const keys = Object.keys(cache);
    if (keys.length > 5000) {
      const trimmed: Record<string, string> = {};
      keys.slice(-5000).forEach((k) => (trimmed[k] = cache[k]));
      cache = trimmed;
    }
    window.localStorage.setItem(STORAGE_CACHE_PREFIX + lang, JSON.stringify(cache));
  } catch {
    /* quota exceeded */
  }
}

// Tags we never walk into
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "KBD", "SAMP",
  "TEXTAREA", "INPUT", "SELECT", "OPTION", "IFRAME", "SVG", "CANVAS",
]);

function shouldSkip(el: Element | null): boolean {
  if (!el) return false;
  if (el.hasAttribute("data-no-translate")) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  return false;
}

function isTranslatable(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length < 2) return false;
  // Skip if purely symbols / numbers / urls
  if (/^[\d\s\W]+$/.test(t)) return false;
  if (/^(https?:\/\/|www\.)/i.test(t)) return false;
  return true;
}

type TextSlot =
  | { kind: "text"; node: Text; original: string }
  | { kind: "attr"; el: Element; attr: string; original: string };

function collectSlots(root: Node): TextSlot[] {
  const slots: TextSlot[] = [];
  if (typeof window === "undefined") return slots;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Skip if any ancestor is opted out
      let cur: Element | null = parent;
      while (cur) {
        if (shouldSkip(cur)) return NodeFilter.FILTER_REJECT;
        cur = cur.parentElement;
      }
      const original = parent.getAttribute(ATTR_ORIGINAL) ?? (node as Text).nodeValue ?? "";
      if (!isTranslatable(original)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((n = walker.nextNode())) {
    const textNode = n as Text;
    const parent = textNode.parentElement!;
    // Store original once on parent (only useful if parent has single text child;
    // for safety we store original on the text node via a WeakMap-like approach instead)
    const original = ORIGINALS.get(textNode) ?? textNode.nodeValue ?? "";
    if (!ORIGINALS.has(textNode)) ORIGINALS.set(textNode, original);
    if (!isTranslatable(original)) continue;
    void parent;
    slots.push({ kind: "text", node: textNode, original });
  }

  // Attributes: placeholder, title, aria-label, alt
  const ATTR_LIST = ["placeholder", "title", "aria-label", "alt"] as const;
  const els = (root as Element).querySelectorAll
    ? (root as Element).querySelectorAll<HTMLElement>("*")
    : ((root as Document).querySelectorAll?.("*") ?? []);
  els.forEach((el) => {
    if (shouldSkip(el)) return;
    let cur: Element | null = el.parentElement;
    while (cur) {
      if (shouldSkip(cur)) return;
      cur = cur.parentElement;
    }
    ATTR_LIST.forEach((a) => {
      const v = el.getAttribute(a);
      if (!v || !isTranslatable(v)) return;
      const key = `${a}:${el.tagName}`;
      const orig = ATTR_ORIG.get(el)?.get(a) ?? v;
      if (!ATTR_ORIG.has(el)) ATTR_ORIG.set(el, new Map());
      ATTR_ORIG.get(el)!.set(a, orig);
      void key;
      slots.push({ kind: "attr", el, attr: a, original: orig });
    });
  });

  return slots;
}

const ORIGINALS = new WeakMap<Text, string>();
const ATTR_ORIG = new WeakMap<Element, Map<string, string>>();

function applyTranslations(slots: TextSlot[], cache: Record<string, string>) {
  slots.forEach((s) => {
    const translated = cache[s.original];
    if (translated == null) return;
    if (s.kind === "text") {
      if (s.node.nodeValue !== translated) s.node.nodeValue = translated;
    } else {
      if (s.el.getAttribute(s.attr) !== translated) s.el.setAttribute(s.attr, translated);
    }
  });
}

function resetToOriginal(slots: TextSlot[]) {
  slots.forEach((s) => {
    if (s.kind === "text") {
      if (s.node.nodeValue !== s.original) s.node.nodeValue = s.original;
    } else {
      if (s.el.getAttribute(s.attr) !== s.original) s.el.setAttribute(s.attr, s.original);
    }
  });
}

async function translateBatch(texts: string[], target: string, targetName: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke("translate", {
    body: { texts, target, targetName },
  });
  if (error) throw new Error(error.message);
  const out = (data as { translations?: string[]; error?: string } | null) ?? {};
  if (out.error) throw new Error(out.error);
  return out.translations ?? texts;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>("en");
  const [translating, setTranslating] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const runIdRef = useRef(0);

  // Hydrate from storage + auto-detect
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_LANG) : null;
    if (stored && languageByCode(stored)) {
      setLangState(stored);
      return;
    }
    // Try browser language first
    const navLang = typeof navigator !== "undefined" ? navigator.language : "";
    const navExact = languageByCode(navLang);
    const navBase = !navExact && navLang ? languageByCode(navLang.split("-")[0]) : undefined;
    if (navExact || navBase) {
      const code = (navExact ?? navBase)!.code;
      setDetected(code);
      setLangState(code);
      return;
    }
    // Fallback: IP geolocation
    fetch("https://ipapi.co/json/")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { country_code?: string } | null) => {
        const cc = j?.country_code?.toUpperCase();
        if (cc && COUNTRY_TO_LANG[cc]) {
          const code = COUNTRY_TO_LANG[cc];
          setDetected(code);
          setLangState(code);
        }
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((code: string) => {
    if (!languageByCode(code)) return;
    try { window.localStorage.setItem(STORAGE_LANG, code); } catch { /* ignore */ }
    setLangState(code);
  }, []);

  // Core translate pass
  const runTranslation = useCallback(async (targetLang: string) => {
    if (typeof document === "undefined") return;
    if (document.documentElement) document.documentElement.lang = targetLang;

    const slots = collectSlots(document.body);

    if (targetLang === "en") {
      // Reset to originals
      resetToOriginal(slots);
      return;
    }

    const cache = loadCache(targetLang);
    // Apply what we have immediately
    applyTranslations(slots, cache);

    // Find untranslated unique texts
    const missingSet = new Set<string>();
    slots.forEach((s) => {
      if (cache[s.original] == null) missingSet.add(s.original);
    });
    const missing = Array.from(missingSet);
    if (missing.length === 0) return;

    const langMeta = languageByCode(targetLang);
    const targetName = langMeta?.name ?? targetLang;

    const myRun = ++runIdRef.current;
    setTranslating(true);
    try {
      // Batch in chunks of 60
      const CHUNK = 60;
      for (let i = 0; i < missing.length; i += CHUNK) {
        if (myRun !== runIdRef.current) return; // superseded
        if (langRef.current !== targetLang) return;
        const chunk = missing.slice(i, i + CHUNK);
        try {
          const translations = await translateBatch(chunk, targetLang, targetName);
          chunk.forEach((src, idx) => {
            const tr = translations[idx];
            if (typeof tr === "string" && tr) cache[src] = tr;
          });
          saveCache(targetLang, cache);
          // Reapply against latest DOM
          const freshSlots = collectSlots(document.body);
          applyTranslations(freshSlots, cache);
        } catch (e) {
          console.warn("Translate batch failed", e);
        }
      }
    } finally {
      if (myRun === runIdRef.current) setTranslating(false);
    }
  }, []);

  // React to lang change + observe DOM mutations
  useEffect(() => {
    if (typeof document === "undefined") return;
    runTranslation(lang);

    if (typeof MutationObserver === "undefined") return;
    let pending: number | null = null;
    const observer = new MutationObserver(() => {
      if (langRef.current === "en") return;
      if (pending != null) return;
      pending = window.setTimeout(() => {
        pending = null;
        runTranslation(langRef.current);
      }, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (pending != null) window.clearTimeout(pending);
    };
  }, [lang, runTranslation]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, languages: LANGUAGES, translating, detected }),
    [lang, setLang, translating, detected],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): Ctx {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    // Safe fallback so consuming components don't crash if provider missing
    return {
      lang: "en",
      setLang: () => {},
      languages: LANGUAGES,
      translating: false,
      detected: null,
    };
  }
  return ctx;
}