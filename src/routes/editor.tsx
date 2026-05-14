import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { LeftSidebar } from "@/components/aura/LeftSidebar";
import { RightSidebar } from "@/components/aura/RightSidebar";
const Mockup = lazy(() =>
  import("@/components/aura/Mockup").then((m) => ({ default: m.Mockup })),
);
import { COLORS, PRODUCT_STYLES, type Fit, type Size, type View } from "@/lib/aura-config";
import { ArrowLeft, User, Sun, Moon, Loader2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { CreditsTopUp } from "@/components/aura/CreditsTopUp";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { generateOpenAIArtwork } from "@/server/openai.functions";
import { ProfileDialog } from "@/components/aura/ProfileDialog";
import { useGenerationHistory } from "@/hooks/use-generation-history";
import { useCart } from "@/hooks/use-cart";
import { CartDrawer } from "@/components/aura/CartDrawer";
import { BuyNowDrawer, type BuyNowItem } from "@/components/aura/BuyNowDrawer";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "TommyMeow Studio — AI Design Editor" },
      { name: "description", content: "Design your custom apparel with AI. Generate artwork, pick a fit, color, size and check out." },
    ],
  }),
  component: Editor,
});

function Editor() {
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [artwork, setArtwork] = useState<string | null>(null);
  const credits = profile?.credits_remaining ?? 0;
  const { items: history, add: addHistory, remove: removeHistory } = useGenerationHistory();
  const cart = useCart();

  const [view, setView] = useState<View>("front");
  const [fit, setFit] = useState<Fit>("Men");
  const [product, setProduct] = useState(PRODUCT_STYLES[0]);
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState<Size>("M");
  const [quantity, setQuantity] = useState(1);

  const artworkFee = artwork ? 4 : 0;
  const unitPrice = product.price + artworkFee;
  const total = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

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
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Please sign in again.");
      const { url } = await generateOpenAIArtwork({
        headers: { Authorization: `Bearer ${token}` },
        data: { prompt: prompt.trim(), style: selectedStyle },
      });
      setArtwork(url);
      addHistory({ url, prompt: prompt.trim(), style: selectedStyle });
      const { error } = await supabase.rpc("consume_credit", {
        _amount: 1,
        _note: `AI generation: ${prompt.slice(0, 80)}`,
      });
      if (error) console.warn("credit consume failed", error);
      await refresh();
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
          
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
            title="Cart"
            className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <ShoppingCart className="h-4 w-4" />
            {cart.totalCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {cart.totalCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                void navigate({ to: "/auth", search: { redirect: "/editor", plan: undefined } });
                return;
              }
              setProfileOpen(true);
            }}
            aria-label="Open profile"
            title="Profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground transition hover:opacity-90"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onPickArtwork={(url) => setArtwork(url)}
      />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <BuyNowDrawer
        open={buyNowItem !== null}
        onOpenChange={(v) => { if (!v) setBuyNowItem(null); }}
        item={buyNowItem}
      />
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
        generationHistory={history}
        onRemoveHistory={removeHistory}
      />

      <main className="flex flex-1 flex-col">
        <section className="flex-1 p-6">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <Mockup
            view={view}
            setView={setView}
            color={color}
            artwork={artwork}
            styleName={`${fit}'s ${product.name}`}
            fabric={fabric}
            fit={fit}
            />
          </Suspense>
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
        unitPrice={unitPrice}
        artwork={artwork}
        onAddToCart={(item) => cart.add(item)}
        onBuyNow={() => {
          setBuyNowItem({
            name: `${fit}'s ${product.name} · ${color.name} · ${size}`,
            description: artwork ? "Includes custom AI artwork" : undefined,
            unitPrice,
            quantity,
            image: artwork,
            colorHex: color.hex,
          });
        }}
      />
      </div>
    </div>
  );
}
