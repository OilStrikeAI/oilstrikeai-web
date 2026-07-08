// Sends an already-subscribed director to Stripe's own hosted billing
// portal — update card, view invoices, cancel — without us building any of
// that ourselves.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  if (profile.role !== "director") {
    return NextResponse.json({ error: "Only a director can manage billing." }, { status: 403 });
  }

  try {
    const { data: company } = await supabase
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", profile.company_id)
      .maybeSingle();

    if (!company?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found yet — subscribe to a plan first." }, { status: 400 });
    }

    const stripe = getStripeClient();
    const origin = new URL(request.url).origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[/api/billing/portal] failed:", err);
    const message = err instanceof Error ? err.message : "Could not open the billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
