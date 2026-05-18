import { supabase } from "@/integrations/supabase/client";

export const ORDER_STAGES = [
  "Order placed",
  "In production",
  "Shipped",
  "Out for delivery",
  "Delivered",
] as const;

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  couponCode: string | null;
  discountAmount: number;
  itemSummary: string | null;
  stage: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  coupon_code: string | null;
  discount_amount: number | string | null;
  item_summary: string | null;
  stage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const toOrder = (r: Row): Order => ({
  id: r.id,
  orderNumber: r.order_number,
  customerName: r.customer_name,
  customerEmail: r.customer_email,
  customerPhone: r.customer_phone,
  customerNote: r.customer_note,
  couponCode: r.coupon_code,
  discountAmount: Number(r.discount_amount ?? 0),
  itemSummary: r.item_summary,
  stage: r.stage,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function lookupOrder(orderNumber: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .ilike("order_number", orderNumber.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as Row) : null;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as Row[] | null)?.map(toOrder) ?? [];
}

export async function createOrder(input: {
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  itemSummary?: string;
  stage?: number;
  notes?: string;
}): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: input.orderNumber.trim(),
      customer_name: input.customerName?.trim() || null,
      customer_email: input.customerEmail?.trim() || null,
      item_summary: input.itemSummary?.trim() || null,
      stage: input.stage ?? 0,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toOrder(data as Row);
}

export async function updateOrderStage(id: string, stage: number): Promise<void> {
  const { error } = await supabase.from("orders").update({ stage }).eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}