export type AdminProduct = {
  id: string;
  name: string;
  price: string;
  description: string;
  category: string;
  tags: string[];
  image: string;
  createdAt: number;
};

const STORAGE_KEY = "aura-admin-products";

export function loadAdminProducts(): AdminProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAdminProducts(products: AdminProduct[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("aura:products-updated"));
  } catch {}
}

export function addAdminProduct(p: Omit<AdminProduct, "id" | "createdAt">) {
  const all = loadAdminProducts();
  const next: AdminProduct = {
    ...p,
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  saveAdminProducts([next, ...all]);
  return next;
}

export function deleteAdminProduct(id: string) {
  saveAdminProducts(loadAdminProducts().filter((p) => p.id !== id));
}