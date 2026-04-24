import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildShopifyAuthUrl,
  createOAuthState,
  normalizeShopDomain,
} from "@/lib/shopify/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopInput = url.searchParams.get("shop") ?? "";
  const shop = normalizeShopDomain(shopInput);
  if (!shop) {
    return NextResponse.redirect(
      new URL("/dashboard/connect-shopify?error=invalid_shop", url)
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", url));

  const state = createOAuthState();
  const cookieStore = await cookies();
  cookieStore.set("shopify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/shopify/callback`;
  const scopes = process.env.SHOPIFY_SCOPES ?? "read_orders";
  const authUrl = buildShopifyAuthUrl({ shop, state, redirectUri, scopes });

  return NextResponse.redirect(authUrl);
}

