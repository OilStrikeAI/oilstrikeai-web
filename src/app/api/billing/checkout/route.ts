// Starts a real Stripe Checkout session for a self-serve tier (director only
// — a manager or employee shouldn't be able to change company billing).
// Reuses the existing Stripe customer if one exists, so a company doesn't
// end up with duplicate customers across repeated checkout attempts.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { getStripeClient, getPriceIdForTier, type SelfServeTier } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile, user } = session;

  if (profile.role !== "director") {
    return NextResponse.json({ error: "Only a director can manage billing." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const tier = body.tier as SelfServeTier;
    if (tier !== "micro" && tier !== "mid") {
      return NextResponse.json({ error: "Unknown plan. Contact us for the Large/custom tier." }, { status: 400 });
    }

    const priceId = getPriceIdForTier(tier);
    const stripe = getStripeClient();

    const { data: company } = await supabase
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", profile.company_id)
      .maybeSingle();

    const origin = new URL(request.url).origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: company?.stripe_customer_id || undefined,
      customer_email: company?.stripe_customer_id ? undefined : user.email,
      client_reference_id: profile.company_id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?checkout=success`,
      cancel_url: `${origin}/dashboard/billing?checkout=canceled`,
      metadata: { company_id: profile.company_id, tier },
    });

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[/api/billing/checkout] failed:", err);
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
