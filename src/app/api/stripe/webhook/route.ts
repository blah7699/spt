import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    if (userId && customerId) {
      await admin.from("billing_customers").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const subAny = sub as unknown as { current_period_end?: number; items?: Stripe.Subscription["items"] };
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const status = sub.status === "active" ? "active" : "inactive";
    const periodEnd = subAny.current_period_end
      ? new Date(subAny.current_period_end * 1000).toISOString()
      : null;

    await admin
      .from("billing_customers")
      .update({
        subscription_status: status,
        current_period_end: periodEnd,
        price_id: subAny.items?.data[0]?.price?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}

