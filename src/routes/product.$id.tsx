import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShoppingCart, Zap, Minus, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { fetchProductById, type AdminProduct } from "@/lib/admin-products";
import { COLORS, SIZES, type Size } from "@/lib/aura-config";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { CartDrawer } from "@/components/aura/CartDrawer";
import { BuyNowDrawer, type BuyNowItem } from "@/components/aura/BuyNowDrawer";
import { getShippingRate } from "@/lib/site-settings";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const product = await fetchProductById(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    const title = p?.seoTitle?.trim() || `${p?.name ?? "Product"} — TommyMeow`;
    const description = (p?.seoDescription?.trim() || p?.description?.trim() || "Premium AI-designed apparel by TommyMeow.").slice(0, 160);
    const url = `https://aura-ai-wearables.lovable.app/product/${params.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { property: "og:image", content: p?.image ?? "" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: p?.image ?? "" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [{
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              description: p.description ?? description,
              image: p.image,
              category: p.category ?? undefined,
              offers: {
                "@type": "Offer",
                price: String(p.price).replace(/[^0-9.]/g, ""),
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url,
              },
            }),
          }]
        : [],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="glass rounded-3xl p-10 max-w-md text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This product no longer exists.</p>
        <div className="mt-6"><Button variant="hero" asChild><Link to="/">Back to home</Link></Button></div>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center px-6">
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: ProductPage,
});

function parsePrice(raw: string): number {
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: AdminProduct };
  const { user } = useAuth();
  const navigate = useNavigate();
  const cart = useCart();
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState<Size>("M");
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [shipping, setShipping] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => { getShippingRate().then(setShipping).catch(() => setShipping(0)); }, []);

  const unitPrice = useMemo(() => parsePrice(product.price), [product.price]);
  const subtotal = unitPrice * quantity;

  const handleAddToCart = () => {
    cart.add({
      productId: product.id,
      productName: product.name,
      fit: "Unisex",
      colorName: color.name,
      colorHex: color.hex,
      size,
      quantity,
      unitPrice,
      artwork: product.image,
    });
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.info("Sign in to purchase.");
      navigate({ to: "/auth", search: { redirect: `/product/${product.id}`, plan: undefined } });
      return;
    }
    setBuyNowItem({
      name: `${product.name} · ${color.name} · ${size}`,
      description: product.description ?? undefined,
      unitPrice,
      quantity,
      image: product.image,
      colorHex: color.hex,
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-border/60 sticky top-0 z-30 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Button variant="ghostNeon" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to gallery</Link>
          </Button>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <ShoppingCart className="h-4 w-4" />
              {cart.totalCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {cart.totalCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 mt-10 grid lg:grid-cols-2 gap-10">
        <div className="glass rounded-3xl overflow-hidden">
          <div className="aspect-[4/5] bg-secondary relative">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            {product.category && (
              <span className="absolute top-4 left-4 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/70 backdrop-blur border border-primary/30 text-primary">
                {product.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-3xl text-primary font-bold">{product.price}</div>
            <div className="text-xs text-muted-foreground">Free returns · Ships in 3–5 days</div>
          </div>

          {product.description && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
          )}

          {product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Color</div>
              <div className="text-xs text-muted-foreground">{color.name}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.name}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${color.id === c.id ? "border-primary scale-110" : "border-border hover:border-primary/60"}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Size</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`min-w-12 px-3 h-10 rounded-lg border text-sm font-medium transition ${size === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/60"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quantity</div>
            <div className="mt-3 inline-flex items-center rounded-lg border border-border">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid place-items-center h-10 w-10 hover:text-primary">
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-12 text-center font-medium">{quantity}</div>
              <button type="button" onClick={() => setQuantity((q) => q + 1)} className="grid place-items-center h-10 w-10 hover:text-primary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border/60 bg-background/40 p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Subtotal</div>
            <div className="text-xl font-semibold">${subtotal.toFixed(2)}</div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={handleAddToCart} disabled={unitPrice === 0}>
              {added ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingCart className="h-4 w-4" /> Add to cart</>}
            </Button>
            <Button variant="hero" size="lg" onClick={handleBuyNow} disabled={unitPrice === 0}>
              <Zap className="h-4 w-4" /> Buy now
            </Button>
          </div>

          {unitPrice === 0 && (
            <p className="mt-3 text-xs text-destructive">Price unavailable. Please contact support.</p>
          )}
        </div>
      </main>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <BuyNowDrawer
        open={buyNowItem !== null}
        onOpenChange={(v) => { if (!v) setBuyNowItem(null); }}
        item={buyNowItem}
        shipping={shipping}
      />
    </div>
  );
}
