import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: BuyNowItem | null;
}) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
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

  if (!item) return null;

  const total = item.unitPrice * item.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.address1 || !form.city || !form.country) {
      toast.error("Please fill in your name, email, address, city and country.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: {
          items: [
            {
              name: item.name,
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              image: item.image ?? undefined,
            },
          ],
          shipping: form,
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
            className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md"
            style={{ background: item.colorHex || "#222" }}
          >
            {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{item.name}</p>
            <p className="text-[11px] text-muted-foreground">Quantity: {item.quantity}</p>
            <p className="mt-1 text-sm font-bold">${total.toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Row>
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </Row>
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Address line 1" value={form.address1} onChange={(v) => setForm({ ...form, address1: v })} required />
          <Field label="Address line 2" value={form.address2} onChange={(v) => setForm({ ...form, address2: v })} />
          <Row>
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            <Field label="State / Province" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          </Row>
          <Row>
            <Field label="ZIP / Postal" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required placeholder="US, BD, IN…" />
          </Row>

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