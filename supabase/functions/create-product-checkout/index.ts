// Dynamic product checkout — uses Stripe price_data so no Price IDs needed per product
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type IncomingItem = {
  name: string;
  description?: string;
  unitPrice: number; // USD dollars
  quantity: number;
  image?: string | null;
  fit?: string;
  colorName?: string;
  size?: string;
};

type ShippingInfo = {
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

type IncomingCoupon = {
  code?: string;
  discount?: number; // USD dollars off the order subtotal
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as {
      items: IncomingItem[];
      shipping?: ShippingInfo;
      shippingRate?: number;
      customerNote?: string;
      coupon?: IncomingCoupon;
    };
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const it of items) {
      if (!it.name || typeof it.unitPrice !== "number" || it.unitPrice <= 0 || !it.quantity || it.quantity <= 0) {
        return new Response(JSON.stringify({ error: "Invalid item in cart" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Optional auth — checkout works for guests too, but we attach user id when present
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user ?? null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

    const customerEmail = body.shipping?.email || user?.email || undefined;

    const origin = req.headers.get("origin") ?? "http://localhost:5173";

    const lineItems = items.map((it) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: it.name,
          description: it.description?.slice(0, 240),
          images: it.image ? [it.image].filter((u) => /^https?:\/\//.test(u)) : undefined,
        },
        unit_amount: Math.round(it.unitPrice * 100),
      },
      quantity: it.quantity,
    }));

    const shippingRate = typeof body.shippingRate === "number" && body.shippingRate > 0 ? body.shippingRate : 0;
    if (shippingRate > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: Math.round(shippingRate * 100),
        },
        quantity: 1,
      });
    }

    // Optional coupon → Stripe one-time amount_off coupon
    const subtotalCents = items.reduce((sum, it) => sum + Math.round(it.unitPrice * 100) * it.quantity, 0);
    let discounts: { coupon: string }[] | undefined;
    let appliedDiscount = 0;
    let appliedCode: string | null = null;
    if (body.coupon?.code && typeof body.coupon.discount === "number" && body.coupon.discount > 0) {
      const amountOff = Math.min(Math.round(body.coupon.discount * 100), subtotalCents);
      if (amountOff > 0) {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: amountOff,
          currency: "usd",
          duration: "once",
          name: body.coupon.code.toUpperCase(),
        });
        discounts = [{ coupon: stripeCoupon.id }];
        appliedDiscount = amountOff / 100;
        appliedCode = body.coupon.code.toUpperCase();
      }
    }

    const itemSummary = items.map((i) => `${i.quantity}x ${i.name}`).join(" | ").slice(0, 480);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: user?.id,
      line_items: lineItems,
      ...(discounts ? { discounts } : { allow_promotion_codes: false }),
      shipping_address_collection: { allowed_countries: ["US","CA","GB","AU","DE","FR","NL","SE","NO","DK","ES","IT","IN","BD","SG","JP","BR","MX"] },
      phone_number_collection: { enabled: true },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/ai-studio?checkout=cancelled`,
      metadata: {
        user_id: user?.id ?? "guest",
        item_summary: itemSummary,
        customer_phone: body.shipping?.phone?.slice(0, 50) ?? "",
        customer_note: body.customerNote?.slice(0, 500) ?? "",
        coupon_code: appliedCode ?? "",
        discount_amount: appliedDiscount.toFixed(2),
      },
    });

    const artworkUrls = items
      .map((item) => item.image)
      .filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url));
    const totalAmount = Math.max(0, subtotalCents / 100 - appliedDiscount) + shippingRate;
    const { error: orderInsertError } = await supabaseAdmin.from("orders").insert({
      order_number: `ORD-${Date.now().toString(36).toUpperCase()}`,
      customer_email: body.shipping?.email || customerEmail || null,
      customer_name: body.shipping?.name || null,
      customer_phone: body.shipping?.phone || null,
      shipping_address: body.shipping ?? null,
      customer_note: body.customerNote?.slice(0, 500) ?? null,
      coupon_code: appliedCode,
      discount_amount: appliedDiscount,
      item_summary: itemSummary,
      item_details: items,
      artwork_urls: artworkUrls,
      total_amount: totalAmount,
      stripe_session_id: session.id,
      stage: 0,
      notes: `Stripe session ${session.id} · pending payment`,
    });
    if (orderInsertError) console.error("pre-create order insert failed", orderInsertError);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-product-checkout error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});