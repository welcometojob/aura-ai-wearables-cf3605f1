import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/r2-upload";

export type AdminProduct = {
  id: string;
  name: string;
  price: string;
  description: string | null;
  category: string | null;
  tags: string[];
  image: string;
  createdAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

type Row = {
  id: string;
  name: string;
  price: string;
  description: string | null;
  category: string | null;
  tags: string[];
  image_url: string;
  created_at: string;
  seo_title: string | null;
  seo_description: string | null;
};

const toProduct = (r: Row): AdminProduct => ({
  id: r.id,
  name: r.name,
  price: r.price,
  description: r.description,
  category: r.category,
  tags: r.tags ?? [],
  image: r.image_url,
  createdAt: r.created_at,
  seoTitle: r.seo_title,
  seoDescription: r.seo_description,
});

export async function fetchProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,price,description,category,tags,image_url,created_at,seo_title,seo_description")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[] | null)?.map(toProduct) ?? [];
}

export async function fetchProductById(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,price,description,category,tags,image_url,created_at,seo_title,seo_description")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toProduct(data as Row) : null;
}

export async function uploadProductImage(file: File, _userId: string): Promise<string> {
  return uploadToR2(file, "product-images");
}

export async function addProduct(input: {
  name: string;
  price: string;
  description?: string;
  category?: string;
  tags: string[];
  image_url: string;
  seo_title?: string;
  seo_description?: string;
}): Promise<AdminProduct> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      price: input.price,
      description: input.description || null,
      category: input.category || null,
      tags: input.tags,
      image_url: input.image_url,
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null,
    })
    .select("id,name,price,description,category,tags,image_url,created_at,seo_title,seo_description")
    .single();
  if (error) throw error;
  return toProduct(data as Row);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}