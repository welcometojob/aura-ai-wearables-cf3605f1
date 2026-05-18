import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LeftSidebar } from "@/components/aura/LeftSidebar";
import { RightSidebar } from "@/components/aura/RightSidebar";
const Mockup = lazy(() =>
  import("@/components/aura/Mockup").then((m) => ({ default: m.Mockup })),
);
import { COLORS, PRODUCT_STYLES, type Fit, type ProductStyle, type Size, type View } from "@/lib/aura-config";
import { listProductStyles } from "@/lib/product-styles";
import { getShippingRate } from "@/lib/site-settings";
import { ArrowLeft, User, Sun, Moon, Loader2, ShoppingCart, PanelLeft, SlidersHorizontal } from "lucide-react";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/ai-studio")({
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
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [artwork, setArtwork] = useState<string | null>(null);
  const credits = profile?.credits_remaining ?? 0;
  const { items: history, add: addHistory, remove: removeHistory } = useGenerationHistory();
  const cart = useCart();
  const [productStyles, setProductStyles] = useState<ProductStyle[]>(PRODUCT_STYLES);
  const [shippingRate, setShippingRate] = useState<number>(0);

  useEffect(() => {
    listProductStyles()
      .then((rows) => {
        if (rows.length === 0) return;
        const mapped: ProductStyle[] = rows
          .filter((r) => r.active)
          .map((r) => ({ id: r.slug, name: r.name, price: r.price, description: r.description }));
        setProductStyles(mapped);
        setProduct((curr) => mapped.find((m) => m.id === curr.id) ?? mapped[0]);
      })
      .catch(() => { /* fall back to defaults */ });
    getShippingRate().then(setShippingRate).catch(() => setShippingRate(0));
  }, []);

  const [view, setView] = useState<View>("front");
  const [fit, setFit] = useState<Fit>("Men");
  const [product, setProduct] = useState(PRODUCT_STYLES[0]);
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState<Size>("M");
  const [quantity, setQuantity] = useState(1);

  const artworkFee = artwork ? 4 : 0;
  const unitPrice = product.price + artworkFee;
  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const total = useMemo(() => subtotal + shippingRate, [subtotal, shippingRate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!user) {
      toast.error("Please sign in to generate designs.");
      void navigate({ to: "/auth", search: { redirect: "/ai-studio", plan: undefined } });
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLeftPanelOpen(true)}
            aria-label="Open design tools"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground transition hover:border-primary hover:text-primary lg:hidden"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition hover:border-primary hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
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
          <LanguageSwitcher variant="compact" />
          <CreditsTopUp
            credits={credits}
            onTopUp={async (amount) => {
              if (!user) {
                void navigate({ to: "/auth", search: { redirect: "/ai-studio", plan: undefined } });
                throw new Error("Please sign in first");
              }
              const { data: sessionData } = await supabase.auth.getSession();
              const token = sessionData.session?.access_token;
              if (!token) throw new Error("Please sign in again");
              const { data, error } = await supabase.functions.invoke("create-credits-checkout", {
                body: { credits: amount },
                headers: { Authorization: `Bearer ${token}` },
              });
              if (error) throw new Error(error.message);
              const url = (data as { url?: string } | null)?.url;
              if (!url) throw new Error("Checkout URL missing");
              window.location.href = url;
            }}
          />
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
                void navigate({ to: "/auth", search: { redirect: "/ai-studio", plan: undefined } });
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
          <button
            type="button"
            onClick={() => setRightPanelOpen(true)}
            aria-label="Open product options"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground transition hover:border-primary hover:text-primary lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
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
        shipping={shippingRate}
      />
      <div className="flex flex-1 overflow-hidden">
      <div className="hidden lg:flex h-full">
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
      </div>
      <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen}>
        <SheetContent side="left" className="w-80 max-w-[88vw] p-0 sm:max-w-[88vw] lg:hidden">
          <div className="h-full overflow-hidden">
            <LeftSidebar
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={() => { handleGenerate(); }}
              generating={generating}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              onUploadImage={(u) => { setArtwork(u); setLeftPanelOpen(false); }}
              artwork={artwork}
              onDeleteArtwork={() => setArtwork(null)}
              generationHistory={history}
              onRemoveHistory={removeHistory}
            />
          </div>
        </SheetContent>
      </Sheet>

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

      <div className="hidden lg:flex h-full">
      <RightSidebar
        fit={fit}
        setFit={setFit}
        product={product}
        setProduct={setProduct}
        productStyles={productStyles}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        quantity={quantity}
        setQuantity={setQuantity}
        total={total}
        unitPrice={unitPrice}
        subtotal={subtotal}
        shipping={shippingRate}
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
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="w-[340px] max-w-[88vw] p-0 sm:max-w-[88vw] lg:hidden">
          <div className="h-full overflow-hidden">
            <RightSidebar
              fit={fit}
              setFit={setFit}
              product={product}
              setProduct={setProduct}
              productStyles={productStyles}
              color={color}
              setColor={setColor}
              size={size}
              setSize={setSize}
              quantity={quantity}
              setQuantity={setQuantity}
              total={total}
              unitPrice={unitPrice}
              subtotal={subtotal}
              shipping={shippingRate}
              artwork={artwork}
              onAddToCart={(item) => { cart.add(item); setRightPanelOpen(false); }}
              onBuyNow={() => {
                setRightPanelOpen(false);
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
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}
