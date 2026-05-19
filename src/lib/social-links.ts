import { supabase } from "@/integrations/supabase/client";

export type SocialLinks = {
  instagram: string;
  facebook: string;
  youtube: string;
};

const EMPTY: SocialLinks = { instagram: "", facebook: "", youtube: "" };

export async function getSocialLinks(): Promise<SocialLinks> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "social_links")
    .maybeSingle();
  if (error) throw error;
  if (!data?.value || typeof data.value !== "object" || Array.isArray(data.value)) return EMPTY;
  const v = data.value as Partial<SocialLinks>;
  return {
    instagram: typeof v.instagram === "string" ? v.instagram : "",
    facebook: typeof v.facebook === "string" ? v.facebook : "",
    youtube: typeof v.youtube === "string" ? v.youtube : "",
  };
}

export async function setSocialLinks(links: SocialLinks): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: "social_links", value: links as unknown as never },
      { onConflict: "key" },
    );
  if (error) throw error;
}
