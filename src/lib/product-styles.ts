import { supabase } from "@/integrations/supabase/client";

export type ProductStyleRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  sortOrder: number;
  active: boolean;
};

export async function listProductStyles(): Promise<ProductStyleRow[]> {
  const { data, error } = await supabase
    .from("product_styles")
    .select("id,slug,name,description,price,sort_order,active")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    price: Number(r.price),
    sortOrder: r.sort_order,
    active: r.active,
  }));
}

export async function updateProductStyle(id: string, patch: Partial<{ name: string; description: string; price: number; active: boolean; sort_order: number }>): Promise<void> {
  const { error } = await supabase.from("product_styles").update(patch).eq("id", id);
  if (error) throw error;
}

export async function addProductStyle(input: { slug: string; name: string; description: string; price: number; sort_order: number }): Promise<void> {
  const { error } = await supabase.from("product_styles").insert(input);
  if (error) throw error;
}

export async function deleteProductStyle(id: string): Promise<void> {
  const { error } = await supabase.from("product_styles").delete().eq("id", id);
  if (error) throw error;
}
