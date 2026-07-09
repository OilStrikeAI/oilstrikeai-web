// Stripe calls this directly — no logged-in user, so it's verified by
// cryptographic signature (STRIPE_WEBHOOK_SECRET) instead of a session, and
// writes with the admin client. This is what actually keeps a company's
// subscription_status in sync with reality (payment succeeded, card
// declined, subscription canceled), not the checkout redirect alone —
// Stripe can send those events at any time, not just right after checkout.
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/errorLog";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[/api/billing/webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[/api/billing/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const companyId = checkoutSession.client_reference_id || checkoutSession.metadata?.company_id;
        const tier = checkoutSession.metadata?.tier;
        if (companyId) {
          await admin
            .from("companies")
            .update({
              stripe_customer_id: checkoutSession.customer as string,
              stripe_subscription_id: checkoutSession.subscription as string,
              subscription_status: "active",
              is_trial: false,
              ...(tier ? { tier } : {}),
            })
            .eq("id", companyId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await admin
          .from("companies")
          .update({ subscription_status: subscription.status })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await admin
          .from("companies")
          .update({ subscription_status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[/api/billing/webhook] failed to process event:", err);
    await logError("/api/billing/webhook", err);
    return NextResponse.json({ error: "Failed to process webhook." }, { status: 500 });
  }
}
