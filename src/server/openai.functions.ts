import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { uploadImageObject } from "./r2.server";

function decodeBase64(b64: string): Uint8Array {
  const clean = b64.replace(/^data:image\/\w+;base64,/, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const generateOpenAIArtwork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        prompt: z.string().min(1).max(2000),
        style: z.string().max(80).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI is not configured (missing OPENAI_API_KEY).");
    const { userId, supabase } = context;

    // Fetch user's plan to decide image quality
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle();
    const plan = (profile?.plan ?? "free") as "free" | "pro" | "business";
    const quality = plan === "business" ? "high" : plan === "pro" ? "medium" : "low";

    const styledPrompt = data.style
      ? `${data.prompt}, ${data.style} style, high detail, vibrant, centered composition, plain background, sticker-style apparel artwork`
      : `${data.prompt}, high detail, vibrant, centered composition, sticker-style apparel artwork`;

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: styledPrompt,
        size: "1024x1024",
        quality,
        n: 1,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI error (${res.status}): ${text.slice(0, 400) || res.statusText}`);
    }

    const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const first = json.data?.[0];
    let bytes: Uint8Array;
    if (first?.b64_json) {
      bytes = decodeBase64(first.b64_json);
    } else if (first?.url) {
      const imgRes = await fetch(first.url);
      if (!imgRes.ok) throw new Error(`Failed to fetch image (${imgRes.status})`);
      bytes = new Uint8Array(await imgRes.arrayBuffer());
    } else {
      throw new Error("OpenAI response did not contain an image.");
    }

    const filename = `openai_${Date.now()}.png`;
    const { publicUrl } = await uploadImageObject({
      folder: `ready-designs/${userId}`,
      filename,
      contentType: "image/png",
      bytes,
    });

    return { url: publicUrl };
  });
