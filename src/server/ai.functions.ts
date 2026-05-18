import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const enhancePrompt = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ prompt: z.string().min(1).max(2000), style: z.string().optional() }).parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const system = `You are a creative prompt engineer for AI apparel artwork.
Take the user's short idea and rewrite it as a vivid, specific, single-paragraph image prompt (40-70 words).
Include subject, composition, color palette, lighting, mood, and artistic technique.
Do NOT add quotes, lists, prefaces, or explanations. Output only the enhanced prompt.`;

    const userMsg = data.style
      ? `Style preset: ${data.style}\nIdea: ${data.prompt}`
      : data.prompt;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace.");
      throw new Error(`AI gateway error: ${res.status} ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const enhanced = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!enhanced) throw new Error("Empty response from AI");
    return { prompt: enhanced };
  });