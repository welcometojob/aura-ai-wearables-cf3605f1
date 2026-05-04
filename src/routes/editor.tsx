import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LeftSidebar } from "@/components/aura/LeftSidebar";
import { RightSidebar } from "@/components/aura/RightSidebar";
import { Mockup } from "@/components/aura/Mockup";
import { COLORS, PRODUCT_STYLES, type Fit, type Size, type View } from "@/lib/aura-config";
import { ArrowLeft, User, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { CreditsTopUp } from "@/components/aura/CreditsTopUp";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "TommyMeow Studio — AI Design Editor" },
      { name: "description", content: "Design your custom apparel with AI. Generate artwork, pick a fit, color, size and check out." },
    ],
  }),
  component: Editor,
});

function fakeArtwork(prompt: string, style: string) {
  const seed = (prompt + style).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = seed % 360;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="hsl(${hue},90%,60%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 60) % 360},80%,30%)"/>
    </radialGradient>
  </defs>
  <circle cx="200" cy="200" r="160" fill="url(#g)"/>
  <g fill="none" stroke="white" stroke-width="2" opacity="0.7">
    <circle cx="200" cy="200" r="120"/>
    <circle cx="200" cy="200" r="80"/>
    <circle cx="200" cy="200" r="40"/>
  </g>
  <text x="200" y="210" font-family="Inter,sans-serif" font-size="18" font-weight="800" text-anchor="middle" fill="white" letter-spacing="3">TOMMYMEOW</text>
  <text x="200" y="240" font-family="Inter,sans-serif" font-size="10" font-weight="600" text-anchor="middle" fill="white" letter-spacing="6" opacity="0.8">${style.toUpperCase()}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function Editor() {
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [artwork, setArtwork] = useState<string | null>(null);
  const credits = profile?.credits_remaining ?? 0;

  const [view, setView] = useState<View>("front");
  const [fit, setFit] = useState<Fit>("Men");
  const [product, setProduct] = useState(PRODUCT_STYLES[0]);
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState<Size>("M");
  const [quantity, setQuantity] = useState(1);

  const artworkFee = artwork ? 4 : 0;
  const total = useMemo(() => (product.price + artworkFee) * quantity, [product.price, artworkFee, quantity]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!user) {
      toast.error("Please sign in to generate designs.");
      void navigate({ to: "/auth", search: { redirect: "/editor", plan: undefined } });
      return;
    }
    if (credits < 1) {
      toast.error("Out of credits. Upgrade your plan to keep designing.");
      return;
    }
    setGenerating(true);
    try {
      const { error } = await supabase.rpc("consume_credit", {
        _amount: 1,
        _note: `AI generation: ${prompt.slice(0, 80)}`,
      });
      if (error) throw error;
      await refresh();
      // Simulated artwork (replace with real AI later)
      await new Promise((r) => setTimeout(r, 700));
      setArtwork(fakeArtwork(prompt, selectedStyle));
      toast.success("Design generated! 1 credit used.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const fabric =
    product.id === "hoodie"
      ? "380gsm Brushed Fleece · 100% Organic Cotton"
      : "240gsm Heavyweight · 100% Organic Cotton";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition hover:border-primary hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <CreditsTopUp credits={credits} />
          <button className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
      <LeftSidebar
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={handleGenerate}
        generating={generating}
        selectedStyle={selectedStyle}
        setSelectedStyle={setSelectedStyle}
        onUploadImage={(u) => setArtwork(u)}
        artwork={artwork}
        onDeleteArtwork={() => setArtwork(null)}
      />

      <main className="flex flex-1 flex-col">
        <section className="flex-1 p-6">
          <Mockup
            view={view}
            setView={setView}
            color={color}
            artwork={artwork}
            styleName={`${fit}'s ${product.name}`}
            fabric={fabric}
          />
        </section>
      </main>

      <RightSidebar
        fit={fit}
        setFit={setFit}
        product={product}
        setProduct={setProduct}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        quantity={quantity}
        setQuantity={setQuantity}
        total={total}
      />
      </div>
    </div>
  );
}
