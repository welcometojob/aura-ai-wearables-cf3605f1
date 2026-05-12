import { useCallback, useEffect, useState } from "react";

const KEY = "tommymeow.generations.v1";
const MAX = 60;

export type GenerationItem = {
  url: string;
  prompt: string;
  style?: string;
  createdAt: number;
};

function read(): GenerationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.url === "string") : [];
  } catch {
    return [];
  }
}

function write(items: GenerationItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // quota exceeded — drop silently
  }
}

export function useGenerationHistory() {
  const [items, setItems] = useState<GenerationItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: Omit<GenerationItem, "createdAt">) => {
    setItems((prev) => {
      const next = [{ ...item, createdAt: Date.now() }, ...prev.filter((p) => p.url !== item.url)].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((url: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.url !== url);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, add, remove, clear };
}