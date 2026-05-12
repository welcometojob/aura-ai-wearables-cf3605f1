import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { items, remove, updateQty, totalPrice, clear } = useCart();
  const [loading, setLoading] = useState(false);

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
            <div className="mb-3 flex items-end justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">${totalPrice.toFixed(2)}</span>
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