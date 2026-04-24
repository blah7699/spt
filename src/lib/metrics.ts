import { createSupabaseServerClient } from "@/lib/supabase/server";

function sumBigintStrings(values: Array<string | null | undefined>) {
  return values.reduce((acc, v) => acc + BigInt(v ?? "0"), 0n);
}

function isMissingTableError(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = typeof anyErr.code === "string" ? anyErr.code : "";
  const msgParts = [anyErr.message, anyErr.details, anyErr.hint]
    .filter((v): v is string => typeof v === "string")
    .join(" ");
  return code === "PGRST205" || /could not find the table/i.test(msgParts);
}

export async function getUserMetrics() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("revenue_cents")
    .eq("user_id", userData.user.id);

  // In a fresh Supabase project, these tables might not exist yet.
  // Treat as "no data" so the dashboard can load and guide setup.
  if (ordersError && !isMissingTableError(ordersError)) throw new Error(ordersError.message);

  const { data: costs, error: costsError } = await supabase
    .from("costs")
    .select("amount_cents")
    .eq("user_id", userData.user.id);

  if (costsError && !isMissingTableError(costsError)) throw new Error(costsError.message);

  const revenueCents = sumBigintStrings((ordersError ? [] : orders ?? []).map((o) => String(o.revenue_cents)));
  const costsCents = sumBigintStrings((costsError ? [] : costs ?? []).map((c) => String(c.amount_cents)));
  const profitCents = revenueCents - costsCents;

  const marginPct =
    revenueCents === 0n ? null : Number((profitCents * 10000n) / revenueCents) / 100;

  return { revenueCents, costsCents, profitCents, marginPct };
}

