import { createSupabaseServerClient } from "@/lib/supabase/server";

function sumBigintStrings(values: Array<string | null | undefined>) {
  return values.reduce((acc, v) => acc + BigInt(v ?? "0"), 0n);
}

export async function getUserMetrics() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("revenue_cents")
    .eq("user_id", userData.user.id);

  if (ordersError) throw new Error(ordersError.message);

  const { data: costs, error: costsError } = await supabase
    .from("costs")
    .select("amount_cents")
    .eq("user_id", userData.user.id);

  if (costsError) throw new Error(costsError.message);

  const revenueCents = sumBigintStrings((orders ?? []).map((o) => String(o.revenue_cents)));
  const costsCents = sumBigintStrings((costs ?? []).map((c) => String(c.amount_cents)));
  const profitCents = revenueCents - costsCents;

  const marginPct =
    revenueCents === 0n ? null : Number((profitCents * 10000n) / revenueCents) / 100;

  return { revenueCents, costsCents, profitCents, marginPct };
}

