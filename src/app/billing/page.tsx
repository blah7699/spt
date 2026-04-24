import { redirect } from "next/navigation";
import { Button, Container, Paper, Stack, Typography } from "@mui/material";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startCheckout } from "./actions";

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
            Upgrade
          </Typography>
          <Typography color="text.secondary">
            Subscribe to access the dashboard.
          </Typography>

          <form action={startCheckout}>
            <Button type="submit" variant="contained" fullWidth>
              Subscribe
            </Button>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}

