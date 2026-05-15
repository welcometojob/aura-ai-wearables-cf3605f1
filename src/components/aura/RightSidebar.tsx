import { useState } from "react";
import { Ruler, Check, Minus, Plus, ShoppingCart, Zap, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { COLORS, SIZES, type ColorSwatch, type Fit, type ProductStyle, type Size } from "@/lib/aura-config";
import { SizeGuideDialog } from "@/components/aura/SizeGuideDialog";

type Props = {
  fit: Fit;
  setFit: (f: Fit) => void;
  product: ProductStyle;
  setProduct: (p: ProductStyle) => void;
  productStyles: ProductStyle[];
  color: ColorSwatch;
  setColor: (c: ColorSwatch) => void;
  size: Size;
  setSize: (s: Size) => void;
  quantity: number;
  total: number;
  unitPrice: number;
  subtotal: number;
  shipping: number;
  artwork: string | null;
  onAddToCart: (item: {
    productId: string;
    productName: string;
    fit: string;
    colorName: string;
    colorHex: string;
    size: string;
    quantity: number;
    unitPrice: number;
    artwork: string | null;
  }) => void;
  onBuyNow: () => void;
};

export function RightSidebar({
  fit, setFit, product, setProduct, productStyles, color, setColor, size, setSize, quantity, setQuantity, total, unitPrice, subtotal, shipping, artwork, onAddToCart, onBuyNow,
}: Props & { setQuantity: (q: number) => void }) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const handleAddToCart = () => {
    onAddToCart({
      productId: product.id,
      productName: product.name,
      fit,
      colorName: color.name,
      colorHex: color.hex,
      size,
      quantity,
      unitPrice,
      artwork,
    });
    toast.success(
      `Added to cart: ${fit}'s ${product.name} · ${color.name} · ${size} · ×${quantity}`,
    );
  };

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-card/40">
      <SizeGuideDialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen} />
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section>
          <Title>Select Fit</Title>
          <div className="mt-2 inline-flex w-full rounded-full border border-border bg-background/40 p-1">
            {(["Men", "Women", "Kids"] as Fit[]).map((f) => (
              <button
                key={f}
                onClick={() => setFit(f)}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  fit === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        <section>
          <Title>Product Style</Title>
          <div className="mt-2 space-y-2">
            {productStyles.map((p) => {
              const active = product.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProduct(p)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                    active ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-muted-foreground"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>${p.price}</span>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Title>Base Color</Title>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {COLORS.map((c) => {
              const active = color.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setColor(c)}
                  title={c.name}
                  className={`relative grid h-9 w-9 place-items-center rounded-full transition ${
                    active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-110"
                  }`}
                  style={{ background: c.hex, border: c.id === "white" ? "1px solid var(--border)" : "none" }}
                >
                  {active && <Check className="h-4 w-4" style={{ color: c.id === "white" || c.id === "yellow" ? "#000" : "#fff" }} />}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Selected: <span className="text-foreground">{color.name}</span>
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <Title>Size</Title>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-primary hover:underline"
            >
              <Ruler className="h-3 w-3" /> View Size Guide
            </button>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {SIZES.map((s) => {
              const active = size === s;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`h-10 rounded-lg border text-xs font-semibold transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground neon-glow"
                      : "border-border bg-background/40 text-foreground hover:border-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Title>Quantity</Title>
          <div className="mt-2 flex items-center gap-3">
            <div className="inline-flex items-center rounded-lg border border-border bg-background/40">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="grid h-10 w-10 place-items-center text-foreground transition hover:text-primary disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                className="grid h-10 w-10 place-items-center text-foreground transition hover:text-primary"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {quantity > 1 ? `${quantity} pieces` : "1 piece"}
            </p>
          </div>
        </section>
      </div>

      <div className="border-t border-border bg-card/80 p-5 backdrop-blur-md">
        <div className="mb-3 space-y-1.5">
          <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
          <Row label="Shipping" value={shipping > 0 ? `+ $${shipping.toFixed(2)}` : "Free"} />
        </div>
        <div className="mb-3 flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Estimated Total</p>
            <p className="mt-0.5 text-3xl font-bold tracking-tight text-foreground">
              ${total.toFixed(2)}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">incl. artwork & shipping</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-primary bg-transparent text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary/10"
          >
            <ShoppingCart className="h-4 w-4" /> Add to Cart
          </button>
          <button
            type="button"
            onClick={onBuyNow}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 neon-glow"
          >
            <Zap className="h-4 w-4" /> Buy Now
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-primary" /> Fast Delivery</span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> Secure Payment</span>
        </div>
      </div>
    </aside>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{children}</h3>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
