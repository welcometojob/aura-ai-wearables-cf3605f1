import { supabase } from "@/integrations/supabase/client";

export type SitePage = {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
};

const KNOWN_SLUGS = ["about", "contact", "privacy", "terms", "returns", "shipping"] as const;
export type KnownSlug = (typeof KNOWN_SLUGS)[number];
export const SITE_PAGE_SLUGS: readonly KnownSlug[] = KNOWN_SLUGS;

export async function listSitePages(): Promise<SitePage[]> {
  const { data, error } = await supabase
    .from("site_pages")
    .select("slug,title,content,updated_at")
    .order("title");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    slug: r.slug,
    title: r.title,
    content: r.content,
    updatedAt: r.updated_at,
  }));
}

export async function fetchSitePage(slug: string): Promise<SitePage | null> {
  const { data, error } = await supabase
    .from("site_pages")
    .select("slug,title,content,updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    slug: data.slug,
    title: data.title,
    content: data.content,
    updatedAt: data.updated_at,
  };
}

export async function upsertSitePage(input: { slug: string; title: string; content: string }): Promise<void> {
  const { error } = await supabase
    .from("site_pages")
    .upsert({ slug: input.slug, title: input.title, content: input.content }, { onConflict: "slug" });
  if (error) throw error;
}