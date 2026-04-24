import { Container, Paper, Stack, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
          Shopify Profit Tracker
        </Typography>
        <Typography color="text.secondary">
          Connect Shopify, import orders, add costs, and see true profit.
        </Typography>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }} gutterBottom>
            MVP
          </Typography>
          <Typography color="text.secondary">
            Next step: Supabase Auth + database schema.
          </Typography>
        </Paper>
      </Stack>
    </Container>
  );
}

