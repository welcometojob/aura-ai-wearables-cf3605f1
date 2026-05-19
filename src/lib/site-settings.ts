import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SHIPPING_RATES: Record<string, number> = { US: 4, UK: 5, EU: 7, INTL: 10 };

function normalizeRates(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_SHIPPING_RATES;
  const raw = value as Record<string, unknown>;
  const rates: Record<string, number> = {};
  for (const [key, val] of Object.entries(raw)) {
    const code = key.trim().toUpperCase();
    const rate = typeof val === "number" ? val : Number(val);
    if (code && Number.isFinite(rate) && rate >= 0) rates[code] = rate;
  }
  return { ...DEFAULT_SHIPPING_RATES, ...rates };
}

export async function getShippingRates(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "shipping_rates")
    .maybeSingle();
  if (error) throw error;
  return normalizeRates(data?.value);
}

export async function setShippingRates(rates: Record<string, number>): Promise<void> {
  const normalized = normalizeRates(rates);
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "shipping_rates", value: normalized as unknown as never }, { onConflict: "key" });
  if (error) throw error;
}

export async function getShippingRateForCountry(countryCode: string): Promise<number> {
  const rates = await getShippingRates();
  const code = countryCode.trim().toUpperCase();
  return rates[code] ?? rates.INTL ?? DEFAULT_SHIPPING_RATES.INTL;
}

export async function getShippingRate(): Promise<number> {
  const rates = await getShippingRates();
  return rates.INTL ?? DEFAULT_SHIPPING_RATES.INTL;
}

export async function setShippingRate(rate: number): Promise<void> {
  const rates = await getShippingRates();
  await setShippingRates({ ...rates, INTL: rate });
}