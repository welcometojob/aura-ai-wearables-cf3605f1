import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getArtworkDataUri = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        url: z.string().url(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const parsed = new URL(data.url);
    if (!["https:", "http:"].includes(parsed.protocol)) {
      throw new Error("Unsupported artwork URL");
    }

    const response = await fetch(parsed.toString(), {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
    });

    if (!response.ok) {
      throw new Error("Artwork image could not be loaded");
    }

    const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png";
    if (!contentType.startsWith("image/")) {
      throw new Error("Artwork URL is not an image");
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      throw new Error("Artwork image is too large");
    }

    return {
      dataUri: `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`,
    };
  });