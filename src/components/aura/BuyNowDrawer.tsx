import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Zap, Tag, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { validateCoupon, type ValidatedCoupon } from "@/lib/coupons";
import { COUNTRIES } from "@/lib/countries";
import { getShippingRateForCountry } from "@/lib/site-settings";
import { uploadToR2 } from "@/lib/r2-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

async function artworkToPublicUrl(artwork: string | null | undefined, filename: string) {
  if (!artwork || /^https?:\/\//.test(artwork)) return artwork ?? undefined;
  if (!artwork.startsWith("data:") && !artwork.startsWith("blob:")) return undefined;
  const response = await fetch(artwork);
  const blob = await response.blob();
  const extension = blob.type.split("/")[1] || "jpg";
  return uploadToR2(new File([blob], `${filename}.${extension}`, { type: blob.type || "image/jpeg" }), "ready-designs");
}

export type BuyNowItem = {
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  image?: string | null;
  colorHex?: string;
};

export function BuyNowDrawer({
  open,
  onOpenChange,
  item,
  shipping = 0,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: BuyNowItem | null;
  shipping?: number;
}) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [applied, setApplied] = useState<ValidatedCoupon | null>(null);
  const [note, setNote] = useState("");
  const [countryShipping, setCountryShipping] = useState(shipping);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "INTL",
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        name: f.name || profile?.display_name || "",
        email: f.email || user?.email || "",
      }));
    }
  }, [open, user, profile]);

  useEffect(() => {
    setCountryShipping(shipping);
  }, [shipping]);

  useEffect(() => {
    if (!open || !form.country) return;
    getShippingRateForCountry(form.country).then(setCountryShipping).catch(() => setCountryShipping(shipping));
  }, [form.country, open, shipping]);

  if (!item) return null;

  const subtotal = item.unitPrice * item.quantity;
  const discount = applied ? Math.min(applied.discount, subtotal) : 0;
  const total = Math.max(0, subtotal - discount) + countryShipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || validating) return;
    setValidating(true);
    try {
      const result = await validateCoupon(couponCode, subtotal);
      setApplied(result);
      toast.success(`Coupon applied — saved $${result.discount.toFixed(2)}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.phone || !form.address1 || !form.city || !form.country) {
      toast.error("Please fill in name, email, phone, address, city and country.");
      return;
    }
    setLoading(true);
    try {
      const image = await artworkToPublicUrl(item.image, `buy-now-${Date.now()}`);
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: {
          items: [
            {
              name: item.name,
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              image,
            },
          ],
          shippingRate: countryShipping,
          shipping: form,
          shippingCountry: form.country,
          shippingAmount: countryShipping,
          customerNote: note.trim() || undefined,
          coupon: applied
            ? {
                code: applied.coupon.code,
                discount: applied.discount,
              }
            : undefined,
        },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Order Details
          </SheetTitle>
        </SheetHeader>

        <div className="mt-2 flex gap-3 rounded-lg border border-border bg-card/40 p-3">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary"
            style={item.colorHex ? { background: item.colorHex } : undefined}
          >
            {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{item.name}</p>
            <p className="text-[11px] text-muted-foreground">Quantity: {item.quantity}</p>
            <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Discount {applied?.coupon.code ? `(${applied.coupon.code})` : ""}</span>
                  <span>− ${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Shipping</span><span>{countryShipping > 0 ? `+ $${countryShipping.toFixed(2)}` : "Free"}</span></div>
              <div className="flex justify-between border-t border-border pt-1 text-sm font-bold text-foreground"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Row>
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </Row>
          <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required placeholder="+1 555 123 4567" />
          <Field label="Address line 1" value={form.address1} onChange={(v) => setForm({ ...form, address1: v })} required />
          <Field label="Address line 2" value={form.address2} onChange={(v) => setForm({ ...form, address2: v })} />
          <Row>
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            <Field label="State / Province" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          </Row>
          <Row>
            <Field label="ZIP / Postal" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Country <span className="text-primary">*</span>
              </span>
              <Select value={form.country} onValueChange={(country) => setForm({ ...form, country })}>
                <SelectTrigger className="h-8 bg-background/60 text-xs">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </Row>

          {/* Note */}
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Order note <span className="text-muted-foreground/60">(optional)</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder="Special instructions, gift message, or anything we should know…"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary"
            />
            <span className="mt-0.5 block text-right text-[9px] text-muted-foreground">{note.length}/500</span>
          </label>

          {/* Coupon */}
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Coupon code <span className="text-muted-foreground/60">(optional)</span>
            </span>
            {applied ? (
              <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-500">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span className="font-semibold">{applied.coupon.code}</span>
                  <span className="text-emerald-500/80">— ${applied.discount.toFixed(2)} off</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearCoupon}
                  aria-label="Remove coupon"
                  className="text-emerald-500/70 hover:text-emerald-300"
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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Pay ${total.toFixed(2)} & Place Order
          </button>
          <p className="text-center text-[10px] text-muted-foreground">
            You'll be redirected to Stripe to complete payment securely.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary"
      />
    </label>
  );
}