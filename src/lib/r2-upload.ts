import { getR2UploadUrl } from "@/server/r2.functions";
import { supabase } from "@/integrations/supabase/client";

export type R2Folder = "product-images" | "ready-designs" | "review-images";

export async function uploadToR2(file: File, folder: R2Folder): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be signed in to upload.");

  const { uploadUrl, publicUrl } = await getR2UploadUrl({
    headers: { Authorization: `Bearer ${token}` },
    data: {
      folder,
      filename: file.name,
      contentType: file.type || "image/jpeg",
      size: file.size,
    },
  });

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${text || res.statusText}`);
  }
  return publicUrl;
}