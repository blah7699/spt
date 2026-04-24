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
import { resendConfirmation, signIn, signUp } from "./actions";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordError(password: string) {
  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password.length > 72) return "Password is too long.";
  return "";
}

export default function LoginPage() {
  const [mode, setMode] = React.useState<"signIn" | "signUp">("signIn");

  const [signInState, signInAction, signInPending] = useActionState(signIn, { error: "" });
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, { error: "" });
  const [resendState, resendAction, resendPending] = useActionState(resendConfirmation, {
    error: "",
  });

  const [signInEmail, setSignInEmail] = React.useState("");
  const [signInPassword, setSignInPassword] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");

  const error = signInState.error || signUpState.error || resendState.error;
  const message = signUpState.message || resendState.message;
  const showResend =
    Boolean(signUpState.message) || (error && error.toLowerCase().includes("confirm your email"));

  const signInEmailOk = isValidEmail(signInEmail);
  const signInPwErr = passwordError(signInPassword);
  const canSignIn = signInEmailOk && !signInPwErr && !signInPending;

  const signUpEmailOk = isValidEmail(signUpEmail);
  const signUpPwErr = passwordError(signUpPassword);
  const canSignUp = signUpEmailOk && !signUpPwErr && !signUpPending;

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              {mode === "signIn" ? "Sign in" : "Create account"}
            </Typography>
            <Typography color="text.secondary">
              {mode === "signIn"
                ? "Access your profit dashboard."
                : "Create your account to start tracking profit."}
            </Typography>
          </Stack>

          {message ? <Alert severity="success">{message}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {mode === "signIn" ? (
            <>
              <form action={signInAction} autoComplete="off">
                <Stack spacing={2}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="off"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    error={Boolean(signInEmail) && !signInEmailOk}
                    helperText={
                      Boolean(signInEmail) && !signInEmailOk ? "Enter a valid email address." : " "
                    }
                  />
                  <TextField
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    slotProps={{ htmlInput: { minLength: 6, maxLength: 72 } }}
                    error={Boolean(signInPassword) && Boolean(signInPwErr)}
                    helperText={Boolean(signInPassword) && signInPwErr ? signInPwErr : " "}
                  />
                  <Button type="submit" variant="contained" disabled={!canSignIn}>
                    Sign in
                  </Button>
                </Stack>
              </form>

              {showResend ? (
                <form action={resendAction} autoComplete="off">
                  <Stack spacing={1}>
                    <Button type="submit" variant="text" disabled={resendPending}>
                      Resend confirmation email
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Uses the email entered above.
                    </Typography>
                  </Stack>
                </form>
              ) : null}

              <Button variant="text" onClick={() => setMode("signUp")} sx={{ alignSelf: "flex-start" }}>
                Create an account
              </Button>
            </>
          ) : (
            <>
              <form action={signUpAction} autoComplete="off">
                <Stack spacing={2}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="off"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    error={Boolean(signUpEmail) && !signUpEmailOk}
                    helperText={
                      Boolean(signUpEmail) && !signUpEmailOk ? "Enter a valid email address." : " "
                    }
                  />
                  <TextField
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    slotProps={{ htmlInput: { minLength: 6, maxLength: 72 } }}
                    error={Boolean(signUpPassword) && Boolean(signUpPwErr)}
                    helperText={Boolean(signUpPassword) && signUpPwErr ? signUpPwErr : " "}
                  />
                  <Button type="submit" variant="contained" disabled={!canSignUp}>
                    Sign up
                  </Button>
                </Stack>
              </form>

              <Button variant="text" onClick={() => setMode("signIn")} sx={{ alignSelf: "flex-start" }}>
                Back to sign in
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

