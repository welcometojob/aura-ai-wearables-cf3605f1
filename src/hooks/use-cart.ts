import { useCallback, useEffect, useState } from "react";

const KEY = "tommymeow.cart.v1";

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  fit: string;
  colorName: string;
  colorHex: string;
  size: string;
  quantity: number;
  unitPrice: number; // includes artwork fee per unit
  artwork?: string | null;
  createdAt: number;
};

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: Omit<CartItem, "id" | "createdAt">) => {
    setItems((prev) => {
      const next = [
        ...prev,
        { ...item, id: crypto.randomUUID(), createdAt: Date.now() },
      ];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id);
      write(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, qty) } : p));
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return { items, add, remove, updateQty, clear, totalCount, totalPrice };
}