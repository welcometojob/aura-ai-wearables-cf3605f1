import { supabase } from "@/integrations/supabase/client";

export type ReadyDesign = {
  id: string;
  name: string;
  category: string | null;
  tags: string[];
  image: string;
  createdAt: string;
};

const BUCKET = "ready-designs";

type Row = {
  id: string;
  name: string;
  category: string | null;
  tags: string[];
  image_url: string;
  created_at: string;
};

const toDesign = (r: Row): ReadyDesign => ({
  id: r.id,
  name: r.name,
  category: r.category,
  tags: r.tags ?? [],
  image: r.image_url,
  createdAt: r.created_at,
});

export async function fetchReadyDesigns(): Promise<ReadyDesign[]> {
  const { data, error } = await supabase
    .from("ready_designs")
    .select("id,name,category,tags,image_url,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[] | null)?.map(toDesign) ?? [];
}

export async function uploadReadyDesignImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function addReadyDesign(input: {
  name: string;
  category?: string;
  tags: string[];
  image_url: string;
}): Promise<ReadyDesign> {
  const { data, error } = await supabase
    .from("ready_designs")
    .insert({
      name: input.name,
      category: input.category || null,
      tags: input.tags,
      image_url: input.image_url,
    })
    .select("id,name,category,tags,image_url,created_at")
    .single();
  if (error) throw error;
  return toDesign(data as Row);
}

export async function deleteReadyDesign(id: string): Promise<void> {
  const { error } = await supabase.from("ready_designs").delete().eq("id", id);
  if (error) throw error;
}