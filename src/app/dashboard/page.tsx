import { redirect } from "next/navigation";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { getUserMetrics } from "@/lib/metrics";
import { centsToMoney } from "@/lib/format";

function isMissingTableError(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = typeof anyErr.code === "string" ? anyErr.code : "";
  const msgParts = [anyErr.message, anyErr.details, anyErr.hint]
    .filter((v): v is string => typeof v === "string")
    .join(" ");
  return code === "PGRST205" || /could not find the table/i.test(msgParts);
}

function KpiCard(props: { label: string; value: string; hint?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={0.5}>
        <Typography color="text.secondary">{props.label}</Typography>
        <Typography variant="h5" component="div" sx={{ fontWeight: 900 }}>
          {props.value}
        </Typography>
        {props.hint ? (
          <Typography variant="body2" color="text.secondary">
            {props.hint}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const metrics = await getUserMetrics();

  const { data: latestOrder, error: latestOrderError } = await supabase
    .from("orders")
    .select("currency")
    .eq("user_id", auth.user.id)
    .order("processed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestOrderError && !isMissingTableError(latestOrderError)) {
    throw new Error(latestOrderError.message);
  }

  const currency = latestOrder?.currency ?? "USD";
  const revenue = metrics ? centsToMoney(metrics.revenueCents, currency) : `${currency} 0.00`;
  const costs = metrics ? centsToMoney(metrics.costsCents, currency) : `${currency} 0.00`;
  const profit = metrics ? centsToMoney(metrics.profitCents, currency) : `${currency} 0.00`;
  const margin = metrics?.marginPct == null ? "—" : `${metrics.marginPct.toFixed(2)}%`;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <div>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
              Dashboard
            </Typography>
            <Typography color="text.secondary">{auth.user.email}</Typography>
          </div>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button href="/dashboard/connect-shopify" variant="contained">
              Connect Shopify
            </Button>
            <Button href="/dashboard/orders" variant="outlined">
              Orders
            </Button>
            <Button href="/dashboard/costs" variant="outlined">
              Costs
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="outlined">
                Sign out
              </Button>
            </form>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, "& > *": { flex: "1 1 220px" } }}>
          <KpiCard label="Revenue" value={revenue} hint="Sum of imported orders" />
          <KpiCard label="Costs" value={costs} hint="Manual product + ad spend" />
          <KpiCard label="Profit" value={profit} hint="Revenue − costs" />
          <KpiCard label="Margin" value={margin} hint="Profit / revenue" />
        </Box>
      </Stack>
    </Container>
  );
}

