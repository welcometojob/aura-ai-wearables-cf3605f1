// Dynamic Stripe checkout for credit top-ups (no Price IDs needed).
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_PER_CREDIT = 3; // USD per credit — keep in sync with CreditsTopUp.tsx

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { credits } = await req.json() as { credits: number };
    const amount = Math.floor(Number(credits));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
      return new Response(JSON.stringify({ error: "Invalid credits amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
    const origin = req.headers.get("origin") ?? "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${amount} AI Credit${amount > 1 ? "s" : ""}`,
            description: "TommyMeow Studio — AI generation credits",
          },
          unit_amount: amount * PRICE_PER_CREDIT * 100,
        },
        quantity: 1,
      }],
      success_url: `${origin}/ai-studio?credits=success`,
      cancel_url: `${origin}/ai-studio?credits=cancelled`,
      metadata: {
        kind: "credits",
        user_id: user.id,
        credits: String(amount),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-credits-checkout error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});