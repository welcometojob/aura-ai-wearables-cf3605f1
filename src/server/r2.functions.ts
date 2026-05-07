import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPresignedUpload } from "./r2.server";

const ALLOWED_FOLDERS = ["product-images", "ready-designs", "review-images"] as const;

export const getR2UploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        folder: z.enum(ALLOWED_FOLDERS),
        filename: z.string().min(1).max(200),
        contentType: z
          .string()
          .regex(/^image\/(png|jpe?g|webp|gif|avif)$/i, "Only image types allowed"),
        size: z.number().int().positive().max(10 * 1024 * 1024),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const folder = `${data.folder}/${userId}`;
    return createPresignedUpload({
      folder,
      filename: data.filename,
      contentType: data.contentType,
    });
  });