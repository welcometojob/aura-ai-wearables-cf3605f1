import { getR2UploadUrl } from "@/server/r2.functions";

export type R2Folder = "product-images" | "ready-designs" | "review-images";

export async function uploadToR2(file: File, folder: R2Folder): Promise<string> {
  const { uploadUrl, publicUrl } = await getR2UploadUrl({
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