import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Check, Loader2, Minus, Plus, ShoppingCart, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { COUNTRIES } from "@/lib/countries";
import { getShippingRateForCountry } from "@/lib/site-settings";
import { validateCoupon, type ValidatedCoupon } from "@/lib/coupons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { items, remove, updateQty, totalPrice, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState(0);
  const [country, setCountry] = useState("INTL");
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [applied, setApplied] = useState<ValidatedCoupon | null>(null);

  useEffect(() => {
    getShippingRateForCountry(country).then(setShipping).catch(() => setShipping(0));
  }, [country]);

  const discount = applied ? Math.min(applied.discount, totalPrice) : 0;
  const grandTotal = Math.max(0, totalPrice - discount) + (items.length > 0 ? shipping : 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || validating) return;
    setValidating(true);
    try {
      const result = await validateCoupon(couponCode, totalPrice);
      setApplied(result);
      toast.success(`Coupon applied: -$${result.discount.toFixed(2)}`);
    } catch (err) {
      setApplied(null);
      toast.error(err instanceof Error ? err.message : "Invalid coupon");
    } finally {
      setValidating(false);
    }
  };

  const handleClearCoupon = () => {
    setApplied(null);
    setCouponCode("");
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: {
          items: items.map((i) => ({
            name: `${i.fit}'s ${i.productName} · ${i.colorName} · ${i.size}`,
            description: i.artwork ? "Includes custom AI artwork" : undefined,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            image: i.artwork ?? undefined,
          })),
          shippingRate: shipping,
          shippingCountry: country,
          shippingAmount: shipping,
          coupon: applied
            ? {
                code: applied.coupon.code,
                discount,
              }
            : undefined,
        },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-background/30 p-6 text-center text-xs text-muted-foreground">
              Your cart is empty. Add a design to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-lg border border-border bg-card/40 p-3">
                  <div
                    className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md"
                    style={{ background: i.colorHex }}
                  >
                    {i.artwork ? (
                      <img src={i.artwork} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-white/70">No art</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {i.fit}'s {i.productName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {i.colorName} · {i.size}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded border border-border bg-background/40">
                        <button
                          type="button"
                          onClick={() => updateQty(i.id, i.quantity - 1)}
                          className="grid h-6 w-6 place-items-center hover:text-primary"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-6 text-center text-[11px] font-semibold">{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(i.id, i.quantity + 1)}
                          className="grid h-6 w-6 place-items-center hover:text-primary"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs font-bold">${(i.unitPrice * i.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i.id)}
                    aria-label="Remove"
                    className="self-start text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="mb-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount {applied?.coupon.code ? `(${applied.coupon.code})` : ""}</span>
                  <span>- ${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping > 0 ? `+ $${shipping.toFixed(2)}` : "Free"}</span></div>
            </div>
            <div className="mb-3">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Coupon code <span className="text-muted-foreground/60">(optional)</span>
              </span>
              {applied ? (
                <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    <span className="font-semibold">{applied.coupon.code}</span>
                    <span className="text-primary/80">— ${discount.toFixed(2)} off</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearCoupon}
                    aria-label="Remove coupon"
                    className="text-primary/70 hover:text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="WELCOME10"
                      className="w-full rounded-md border border-border bg-background/60 pl-7 pr-2 py-1.5 text-xs uppercase outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || validating}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-primary/50 bg-primary/10 px-3 text-[11px] font-semibold uppercase tracking-wider text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
            </div>
            <label className="mb-3 block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Shipping country
              </span>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-9 bg-background/60 text-xs">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <div className="mb-3 flex items-end justify-between border-t border-border pt-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">${grandTotal.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Checkout
              </button>
              <button
                type="button"
                onClick={() => clear()}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-3 text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}