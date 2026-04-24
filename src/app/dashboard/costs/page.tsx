import { redirect } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { centsToMoney } from "@/lib/format";
import { addCost, deleteCost } from "./actions";

function parseBigint(value: unknown) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  return BigInt(String(value ?? "0"));
}

export default async function CostsPage({
  searchParams,
}: {
  searchParams: { created?: string; deleted?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: latestOrder } = await supabase
    .from("orders")
    .select("currency")
    .eq("user_id", userData.user.id)
    .order("processed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currency = latestOrder?.currency ?? "USD";

  const { data: costs } = await supabase
    .from("costs")
    .select("id, kind, amount_cents, notes, incurred_at, created_at")
    .eq("user_id", userData.user.id)
    .order("incurred_at", { ascending: false })
    .limit(25);

  const error =
    searchParams.error === "no_shop"
      ? "No Shopify shop connected yet."
      : searchParams.error === "invalid_amount"
      ? "Invalid amount. Use a number like 12.34"
      : searchParams.error === "invalid_kind"
      ? "Invalid cost kind."
      : searchParams.error ?? "";

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            Costs
          </Typography>
          <Typography color="text.secondary">
            Add product costs and ad spend manually (MVP).
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button href="/dashboard" variant="outlined">
            Back to dashboard
          </Button>
        </Stack>

        {searchParams.created ? <Alert severity="success">Cost created.</Alert> : null}
        {searchParams.deleted ? <Alert severity="success">Cost deleted.</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800 }} gutterBottom>
            Add a cost
          </Typography>

          <form action={addCost} autoComplete="off">
            <Stack spacing={2}>
              <TextField name="kind" label="Kind" select defaultValue="product">
                <MenuItem value="product">Product cost</MenuItem>
                <MenuItem value="ad_spend">Ad spend</MenuItem>
              </TextField>

              <TextField
                name="amount"
                label="Amount"
                placeholder="12.34"
                autoComplete="off"
                required
                helperText="Enter a number like 12.34 (stored as cents)."
              />

              <TextField
                name="orderId"
                label="Order ID (optional)"
                placeholder="UUID from orders table"
                autoComplete="off"
                helperText="MVP: paste an order UUID to tie this cost to a specific order."
              />

              <TextField name="notes" label="Notes (optional)" autoComplete="off" />

              <TextField
                name="incurredAt"
                label="Incurred at (optional)"
                type="datetime-local"
                autoComplete="off"
              />

              <Button type="submit" variant="contained">
                Add cost
              </Button>
            </Stack>
          </form>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800 }} gutterBottom>
            Recent costs
          </Typography>

          <Stack spacing={1.5}>
            {(costs ?? []).map((c) => {
              const amount = centsToMoney(parseBigint(c.amount_cents), currency);
              return (
                <Paper key={c.id} variant="outlined" sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1,
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                    }}
                  >
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {c.kind === "ad_spend" ? "Ad spend" : "Product cost"} — {amount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.notes || "—"} • {c.incurred_at ?? c.created_at}
                      </Typography>
                    </Stack>

                    <form action={deleteCost}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" variant="outlined" color="error">
                        Delete
                      </Button>
                    </form>
                  </Box>
                </Paper>
              );
            })}

            {(costs ?? []).length === 0 ? (
              <Typography color="text.secondary">No costs yet.</Typography>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

