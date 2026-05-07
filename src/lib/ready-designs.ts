import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/r2-upload";

export type ReadyDesign = {
  id: string;
  name: string;
  category: string | null;
  tags: string[];
  image: string;
  createdAt: string;
};

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

export async function uploadReadyDesignImage(file: File, _userId: string): Promise<string> {
  return uploadToR2(file, "ready-designs");
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