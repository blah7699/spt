"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Alert,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { saveSupabaseEnv } from "./actions";

export default function SetupPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const [state, action, pending] = useActionState(saveSupabaseEnv, { error: "" });

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
              Local setup
            </Typography>
            <Typography color="text.secondary">
              This writes <b>.env.local</b> for you (development only).
            </Typography>
          </Stack>

          {searchParams.saved ? (
            <Alert severity="success">
              Saved <b>.env.local</b>. Restart <b>npm run dev</b> to load it.
            </Alert>
          ) : null}

          {state.error ? <Alert severity="error">{state.error}</Alert> : null}

          <form action={action} autoComplete="off">
            <Stack spacing={2}>
              <TextField
                name="url"
                label="Supabase URL"
                placeholder="https://xxxx.supabase.co"
                autoComplete="off"
                required
              />
              <TextField
                name="anonKey"
                label="Supabase anon key"
                autoComplete="off"
                required
              />
              <Button type="submit" variant="contained" disabled={pending}>
                Save .env.local
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}

