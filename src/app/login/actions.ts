"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthActionState = { error: string; message?: string };

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function isValidEmail(email: string) {
  // Reasonable client/server validation (Supabase will still validate on its side).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  // Matches Supabase default minimum length requirement.
  if (password.length < 6) return "Password should be at least 6 characters.";
  if (password.length > 72) return "Password is too long.";
  return null;
}

export async function signIn(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sign-in failed." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Supabase often returns "Invalid login credentials" for unconfirmed emails too.
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return {
        error:
          "Invalid login credentials. If you just signed up, confirm your email first (or resend the confirmation below).",
      };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sign-up failed." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Ensures the verification link can complete the session on our app.
      emailRedirectTo: `${appUrl()}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is required, session will be null.
  if (!data.session) {
    return {
      error: "",
      message:
        "Check your email to confirm your account. After confirming, come back here and sign in.",
    };
  }

  redirect("/dashboard");
}

export async function resendConfirmation(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email above, then click resend." };
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Resend failed." };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${appUrl()}/auth/callback` },
  });
  if (error) return { error: error.message };

  return { error: "", message: "Confirmation email resent. Check your inbox/spam." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

