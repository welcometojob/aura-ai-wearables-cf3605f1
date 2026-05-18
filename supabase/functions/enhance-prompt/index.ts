const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const style = typeof body?.style === "string" ? body.style : undefined;
    if (!prompt || prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Invalid prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const system = `You are a creative prompt engineer for AI apparel artwork.
Take the user's short idea and rewrite it as a vivid, specific, single-paragraph image prompt (40-70 words).
Include subject, composition, color palette, lighting, mood, and artistic technique.
Do NOT add quotes, lists, prefaces, or explanations. Output only the enhanced prompt.`;

    const userMsg = style ? `Style preset: ${style}\nIdea: ${prompt}` : prompt;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = `AI gateway error: ${res.status}`;
      if (res.status === 429) msg = "Rate limit reached. Please wait a moment.";
      else if (res.status === 402) msg = "AI credits exhausted. Add credits in Settings → Workspace.";
      else if (text) msg += ` ${text.slice(0, 200)}`;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await res.json();
    const enhanced = json?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!enhanced) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ prompt: enhanced }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});