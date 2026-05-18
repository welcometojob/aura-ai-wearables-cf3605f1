import { supabase } from "@/integrations/supabase/client";

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

const toCoupon = (r: Row): Coupon => ({
  id: r.id,
  code: r.code,
  type: r.type,
  value: Number(r.value),
  active: r.active,
  expiresAt: r.expires_at,
  maxUses: r.max_uses,
  uses: r.uses,
  note: r.note,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export type ValidatedCoupon = {
  coupon: Coupon;
  discount: number; // USD amount applied
};

export async function validateCoupon(code: string, subtotal: number): Promise<ValidatedCoupon> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error("Enter a coupon code");

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", trimmed)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Invalid coupon code");

  const c = toCoupon(data as Row);
  if (!c.active) throw new Error("This coupon is no longer active");
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) {
    throw new Error("This coupon has expired");
  }
  if (c.maxUses != null && c.uses >= c.maxUses) {
    throw new Error("This coupon has reached its usage limit");
  }

  const discount = c.type === "percent"
    ? Math.min(subtotal, (subtotal * c.value) / 100)
    : Math.min(subtotal, c.value);

  return { coupon: c, discount: Math.round(discount * 100) / 100 };
}

export async function fetchAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[] | null)?.map(toCoupon) ?? [];
}

export async function createCoupon(input: {
  code: string;
  type: "percent" | "fixed";
  value: number;
  active?: boolean;
  expiresAt?: string | null;
  maxUses?: number | null;
  note?: string | null;
}): Promise<Coupon> {
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: input.code.trim().toUpperCase(),
      type: input.type,
      value: input.value,
      active: input.active ?? true,
      expires_at: input.expiresAt || null,
      max_uses: input.maxUses ?? null,
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toCoupon(data as Row);
}

export async function updateCoupon(id: string, patch: Partial<{
  active: boolean;
  value: number;
  expiresAt: string | null;
  maxUses: number | null;
  note: string | null;
}>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.active != null) payload.active = patch.active;
  if (patch.value != null) payload.value = patch.value;
  if (patch.expiresAt !== undefined) payload.expires_at = patch.expiresAt;
  if (patch.maxUses !== undefined) payload.max_uses = patch.maxUses;
  if (patch.note !== undefined) payload.note = patch.note;
  const { error } = await supabase.from("coupons").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}