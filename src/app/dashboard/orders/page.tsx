import { redirect } from "next/navigation";
import { Alert, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { importOrders } from "./actions";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { imported?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("shopify_order_id, currency, revenue_cents, processed_at, created_at")
    .eq("user_id", userData.user.id)
    .order("processed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            Orders
          </Typography>
          <Typography color="text.secondary">
            Import orders from Shopify and store them in Supabase.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <form action={importOrders}>
            <Button type="submit" variant="contained">
              Import orders
            </Button>
          </form>
          <Button href="/dashboard" variant="outlined">
            Back to dashboard
          </Button>
        </Stack>

        {searchParams.imported ? (
          <Alert severity="success">Imported {searchParams.imported} orders.</Alert>
        ) : null}

        {searchParams.error ? (
          <Alert severity="error">
            {searchParams.error === "no_shop"
              ? "No Shopify shop connected yet."
              : searchParams.error}
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 700 }} gutterBottom>
            Latest imported
          </Typography>
          <Stack spacing={1}>
            {(orders ?? []).map((o) => (
              <Typography key={o.shopify_order_id} color="text.secondary">
                #{o.shopify_order_id} — {o.currency} {String(o.revenue_cents)}¢ —{" "}
                {o.processed_at ?? o.created_at}
              </Typography>
            ))}
            {(orders ?? []).length === 0 ? (
              <Typography color="text.secondary">No orders yet.</Typography>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

