const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const texts: string[] = Array.isArray(body?.texts) ? body.texts.slice(0, 200) : [];
    const target: string = typeof body?.target === "string" ? body.target : "";
    const targetName: string = typeof body?.targetName === "string" ? body.targetName : target;

    if (!texts.length || !target) {
      return new Response(JSON.stringify({ error: "Missing texts or target" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleaned = texts.map((t) => (typeof t === "string" ? t.slice(0, 500) : ""));

    const system = `You are a professional translator. Translate every input string into ${targetName} (${target}).
Rules:
- Preserve meaning, tone, punctuation, emoji, and casing where possible.
- Do NOT translate brand names, URLs, email addresses, code, or numbers.
- Return ONLY a JSON array of strings, exactly the same length and order as the input. No prose.`;

    const userMsg = JSON.stringify(cleaned);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
      else if (res.status === 402) msg = "AI credits exhausted.";
      else if (text) msg += ` ${text.slice(0, 200)}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    let content: string = json?.choices?.[0]?.message?.content?.trim() ?? "";
    // Strip code fences if model wrapped them
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let translations: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) translations = parsed.map((x) => String(x ?? ""));
    } catch {
      // fallback: return original
      translations = cleaned;
    }

    // Pad/trim to input length
    if (translations.length < cleaned.length) {
      translations = translations.concat(cleaned.slice(translations.length));
    } else if (translations.length > cleaned.length) {
      translations = translations.slice(0, cleaned.length);
    }

    return new Response(JSON.stringify({ translations }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});