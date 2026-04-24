"use client";

import * as React from "react";
import { useActionState } from "react";
import { Alert, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { startShopifyOAuth } from "./actions";

export default function ConnectShopifyPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const [state, action, pending] = useActionState(startShopifyOAuth, { error: "" });

  const errorFromQuery =
    searchParams.error === "invalid_shop"
      ? "Invalid shop domain."
      : searchParams.error === "invalid_state"
      ? "OAuth state mismatch. Please try again."
      : searchParams.error === "invalid_hmac"
      ? "OAuth verification failed. Please try again."
      : searchParams.error === "db"
      ? "Could not save connection. Please try again."
      : "";

  const error = state.error || errorFromQuery;

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              Connect Shopify
            </Typography>
            <Typography color="text.secondary">
              Enter your store domain (ends with <b>myshopify.com</b>).
            </Typography>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <form action={action} autoComplete="off">
            <Stack spacing={2}>
              <TextField
                name="shop"
                label="Shop domain"
                placeholder="acme.myshopify.com"
                autoComplete="off"
                required
              />
              <Button type="submit" variant="contained" disabled={pending}>
                Connect
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}

