// Stripe webhook receiver (verifies signature, updates profile + subscription)
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PRICE_TO_PLAN: Record<string, { plan: "pro" | "business"; credits: number }> = {
  [Deno.env.get("STRIPE_PRICE_PRO") ?? ""]: { plan: "pro", credits: 20 },
  [Deno.env.get("STRIPE_PRICE_BUSINESS") ?? ""]: { plan: "business", credits: 85 },
};

async function findUserId(opts: { customerId?: string | null; userIdMeta?: string | null; email?: string | null }) {
  if (opts.userIdMeta) return opts.userIdMeta;
  if (opts.customerId) {
    const { data } = await supabaseAdmin.from("profiles").select("user_id").eq("stripe_customer_id", opts.customerId).maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }
  if (opts.email) {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const u = data?.users.find((x) => x.email?.toLowerCase() === opts.email!.toLowerCase());
    if (u) return u.id;
  }
  return null;
}

async function upsertSubscription(sub: Stripe.Subscription, userId: string) {
  const priceId = sub.items.data[0]?.price.id ?? "";
  const map = PRICE_TO_PLAN[priceId];
  const plan = map?.plan ?? "free";

  await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    plan,
    status: sub.status,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
  }, { onConflict: "stripe_subscription_id" });

  // Update profile plan + add monthly credits if active
  const profileUpdate: Record<string, unknown> = {
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    plan_renews_at: new Date(sub.current_period_end * 1000).toISOString(),
  };
  if (sub.status === "active" || sub.status === "trialing") {
    profileUpdate.plan = plan;
    if (map) profileUpdate.credits_remaining = map.credits;
  } else if (sub.status === "canceled" || sub.status === "unpaid") {
    profileUpdate.plan = "free";
  }
  await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", userId);
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (e) {
    console.error("Signature verification failed:", (e as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency
  const { data: seen } = await supabaseAdmin.from("stripe_webhook_events").select("id").eq("id", event.id).maybeSingle();
  if (seen) return new Response("ok", { status: 200 });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          const userId = await findUserId({
            customerId: s.customer as string,
            userIdMeta: (s.metadata?.user_id as string) ?? (s.client_reference_id ?? null),
            email: s.customer_email,
          });
          if (userId) await upsertSubscription(sub, userId);
        }
        if (s.mode === "payment") {
          // Credit top-up purchases — credit user balance instead of creating an order.
          if ((s.metadata?.kind as string) === "credits") {
            const userId = await findUserId({
              customerId: s.customer as string,
              userIdMeta: (s.metadata?.user_id as string) ?? (s.client_reference_id ?? null),
              email: s.customer_details?.email ?? s.customer_email,
            });
            const credits = parseInt((s.metadata?.credits as string) ?? "0", 10);
            if (userId && credits > 0) {
              const { data: prof } = await supabaseAdmin
                .from("profiles").select("credits_remaining").eq("user_id", userId).maybeSingle();
              const next = (prof?.credits_remaining ?? 0) + credits;
              await supabaseAdmin.from("profiles").update({ credits_remaining: next }).eq("user_id", userId);
              await supabaseAdmin.from("credit_transactions").insert({
                user_id: userId, amount: credits, type: "purchase",
                note: `Stripe top-up · session ${s.id}`,
              });
            }
            break;
          }
          const couponCode = (s.metadata?.coupon_code as string) || null;
          const shippingAddress = s.shipping_details ? {
            name: s.shipping_details.name,
            phone: s.customer_details?.phone ?? null,
            address1: s.shipping_details.address?.line1 ?? "",
            address2: s.shipping_details.address?.line2 ?? "",
            city: s.shipping_details.address?.city ?? "",
            state: s.shipping_details.address?.state ?? "",
            zip: s.shipping_details.address?.postal_code ?? "",
            country: s.shipping_details.address?.country ?? "",
          } : null;
          const { error: orderUpdateError } = await supabaseAdmin
            .from("orders")
            .update({
              stage: 1,
              ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
              notes: `Stripe session ${s.id} · paid total $${((s.amount_total ?? 0) / 100).toFixed(2)}`,
            })
            .eq("stripe_session_id", s.id);
          if (orderUpdateError) console.error("order paid update failed", orderUpdateError);
          if (couponCode) {
            const { data: cRow } = await supabaseAdmin
              .from("coupons")
              .select("uses")
              .eq("code", couponCode)
              .maybeSingle();
            const currentUses = (cRow as { uses?: number } | null)?.uses ?? 0;
            await supabaseAdmin
              .from("coupons")
              .update({ uses: currentUses + 1 })
              .eq("code", couponCode);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await findUserId({
          customerId: sub.customer as string,
          userIdMeta: (sub.metadata?.user_id as string) ?? null,
        });
        if (userId) await upsertSubscription(sub, userId);
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          const sub = await stripe.subscriptions.retrieve(inv.subscription as string);
          const userId = await findUserId({
            customerId: inv.customer as string,
            userIdMeta: (sub.metadata?.user_id as string) ?? null,
            email: inv.customer_email,
          });
          if (userId) await upsertSubscription(sub, userId);
        }
        break;
      }
      default:
        // ignore unhandled
        break;
    }

    await supabaseAdmin.from("stripe_webhook_events").insert({
      id: event.id, type: event.type, payload: event as unknown as Record<string, unknown>,
    });

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("webhook handler error", e);
    return new Response((e as Error).message, { status: 500 });
  }
});