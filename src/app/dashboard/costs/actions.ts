"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moneyToCents } from "@/lib/money";

export async function addCost(_: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const kind = String(_.get("kind") ?? "");
  const amount = String(_.get("amount") ?? "");
  const notes = String(_.get("notes") ?? "");
  const incurredAt = String(_.get("incurredAt") ?? "");
  const orderId = String(_.get("orderId") ?? "");

  if (kind !== "product" && kind !== "ad_spend") {
    redirect("/dashboard/costs?error=invalid_kind");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!shop) redirect("/dashboard/costs?error=no_shop");

  let amountCents: bigint;
  try {
    amountCents = moneyToCents(amount);
  } catch {
    redirect("/dashboard/costs?error=invalid_amount");
  }

  const { error } = await supabase.from("costs").insert({
    user_id: userData.user.id,
    shop_id: shop.id,
    order_id: orderId ? orderId : null,
    kind,
    amount_cents: amountCents.toString(),
    notes: notes || null,
    incurred_at: incurredAt ? new Date(incurredAt).toISOString() : new Date().toISOString(),
  });

  if (error) redirect(`/dashboard/costs?error=${encodeURIComponent(error.message)}`);

  redirect("/dashboard/costs?created=1");
}

export async function deleteCost(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase.from("costs").delete().eq("id", id).eq("user_id", userData.user.id);
  if (error) redirect(`/dashboard/costs?error=${encodeURIComponent(error.message)}`);

  redirect("/dashboard/costs?deleted=1");
}

