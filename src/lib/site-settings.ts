import { supabase } from "@/integrations/supabase/client";

export async function getShippingRate(): Promise<number> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "shipping_rate")
    .maybeSingle();
  if (error) throw error;
  if (!data) return 0;
  const v = data.value;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function setShippingRate(rate: number): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "shipping_rate", value: rate as unknown as never }, { onConflict: "key" });
  if (error) throw error;
}