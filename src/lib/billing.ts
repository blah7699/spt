import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function userHasActiveSubscription() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data } = await supabase
    .from("billing_customers")
    .select("subscription_status")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return data?.subscription_status === "active";
}

