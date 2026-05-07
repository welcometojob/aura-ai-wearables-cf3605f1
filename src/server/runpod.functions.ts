import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { uploadImageObject } from "./r2.server";

const RUNPOD_TIMEOUT_MS = 90_000;

function decodeBase64(b64: string): Uint8Array {
  const clean = b64.replace(/^data:image\/\w+;base64,/, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const generateRunpodArtwork = createServerFn({ method: "POST" })
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
    const apiKey = process.env.RUNPOD_API_KEY;
    const endpointId = process.env.RUNPOD_ENDPOINT_ID;
    if (!apiKey || !endpointId) {
      throw new Error("RunPod is not configured (missing RUNPOD_API_KEY or RUNPOD_ENDPOINT_ID).");
    }
    const { userId } = context;

    const styledPrompt = data.style
      ? `${data.prompt}, ${data.style} style, high detail, vibrant, centered composition, transparent or plain background, sticker-style apparel artwork`
      : `${data.prompt}, high detail, vibrant, centered composition, sticker-style apparel artwork`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RUNPOD_TIMEOUT_MS);

    let runpodJson: any;
    try {
      const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/runsync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          input: {
            prompt: styledPrompt,
            negative_prompt: "blurry, low quality, watermark, text, signature, deformed",
          num_inference_steps: 6,
          guidance_scale: 2,
          width: 512,
          height: 512,
          num_images: 1,
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`RunPod error (${res.status}): ${text.slice(0, 300) || res.statusText}`);
      }
      runpodJson = await res.json();
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error("RunPod request timed out. Try again.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    // Handle async statuses: poll /status until COMPLETED / FAILED
    if (runpodJson?.status && runpodJson.status !== "COMPLETED") {
      if (runpodJson.status === "IN_QUEUE" || runpodJson.status === "IN_PROGRESS") {
        const jobId = runpodJson.id;
        const deadline = Date.now() + RUNPOD_TIMEOUT_MS;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 2000));
          const s = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          runpodJson = await s.json();
          if (runpodJson?.status === "COMPLETED") break;
          if (runpodJson?.status === "FAILED" || runpodJson?.status === "CANCELLED") {
            throw new Error(
              `RunPod job ${runpodJson.status}. Full response: ${JSON.stringify(runpodJson).slice(0, 600)}`,
            );
          }
        }
        if (runpodJson?.status !== "COMPLETED") {
          throw new Error(`RunPod job did not complete in time (last status: ${runpodJson?.status})`);
        }
      } else {
        throw new Error(
          `RunPod job ${runpodJson.status}. Full response: ${JSON.stringify(runpodJson).slice(0, 600)}`,
        );
      }
    }

    // SDXL-turbo serverless workers commonly return one of:
    // output: { image_url: "..." } | { image: "<base64>" } | [{ image: "<base64>" }] | { images: ["<base64>"] }
    const output = runpodJson?.output;
    let base64: string | undefined;
    let remoteUrl: string | undefined;

    const pickFrom = (o: any) => {
      if (!o) return;
      if (typeof o === "string") {
        if (o.startsWith("http")) remoteUrl = o;
        else base64 = o;
        return;
      }
      if (typeof o.image_url === "string") remoteUrl = o.image_url;
      else if (typeof o.url === "string") remoteUrl = o.url;
      else if (typeof o.image === "string") base64 = o.image;
      else if (Array.isArray(o.images) && o.images.length) {
        const first = o.images[0];
        if (typeof first === "string") {
          if (first.startsWith("http")) remoteUrl = first;
          else base64 = first;
        } else pickFrom(first);
      }
    };
    if (Array.isArray(output)) pickFrom(output[0]);
    else pickFrom(output);

    let bytes: Uint8Array;
    if (base64) {
      bytes = decodeBase64(base64);
    } else if (remoteUrl) {
      const imgRes = await fetch(remoteUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch generated image (${imgRes.status})`);
      bytes = new Uint8Array(await imgRes.arrayBuffer());
    } else {
      throw new Error("RunPod response did not contain an image.");
    }

    const filename = `runpod_${Date.now()}.png`;
    const { publicUrl } = await uploadImageObject({
      folder: `ready-designs/${userId}`,
      filename,
      contentType: "image/png",
      bytes,
    });

    return { url: publicUrl };
  });