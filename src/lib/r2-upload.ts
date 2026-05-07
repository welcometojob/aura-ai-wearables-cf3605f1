import { uploadR2Image } from "@/server/r2.functions";
import { supabase } from "@/integrations/supabase/client";

export type R2Folder = "product-images" | "ready-designs" | "review-images";

export async function uploadToR2(file: File, folder: R2Folder): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be signed in to upload.");

  const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
  const { publicUrl } = await uploadR2Image({
    headers: { Authorization: `Bearer ${token}` },
    data: {
      folder,
      filename: file.name,
      contentType: file.type || "image/jpeg",
      bytes,
    },
  });
  return publicUrl;
}