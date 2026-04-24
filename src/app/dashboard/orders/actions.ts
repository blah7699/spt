"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllOrders } from "@/lib/shopify/orders";
import { moneyToCents } from "@/lib/money";

export async function importOrders(_: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, shop_domain, access_token")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shopError) redirect(`/dashboard/orders?error=${encodeURIComponent(shopError.message)}`);
  if (!shop) redirect("/dashboard/orders?error=no_shop");

  const orders = await fetchAllOrders({
    shopDomain: shop.shop_domain,
    accessToken: shop.access_token,
  });

  const rows = orders.map((o) => ({
    user_id: userData.user!.id,
    shop_id: shop.id,
    shopify_order_id: o.id,
    currency: o.currency,
    revenue_cents: moneyToCents(o.total_price).toString(),
    processed_at: o.processed_at ? new Date(o.processed_at).toISOString() : null,
    raw: o,
  }));

  const { error: upsertError } = await supabase
    .from("orders")
    .upsert(rows, { onConflict: "shop_id,shopify_order_id" });

  if (upsertError) {
    redirect(`/dashboard/orders?error=${encodeURIComponent(upsertError.message)}`);
  }

  redirect(`/dashboard/orders?imported=${orders.length}`);
}

