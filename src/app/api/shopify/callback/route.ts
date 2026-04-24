import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  exchangeCodeForAccessToken,
  normalizeShopDomain,
  verifyShopifyHmac,
} from "@/lib/shopify/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", url));

  const shop = normalizeShopDomain(url.searchParams.get("shop") ?? "");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("shopify_oauth_state")?.value;

  if (!shop || !code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(
      new URL("/dashboard/connect-shopify?error=invalid_state", url)
    );
  }

  if (!verifyShopifyHmac(url.searchParams)) {
    return NextResponse.redirect(
      new URL("/dashboard/connect-shopify?error=invalid_hmac", url)
    );
  }

  const token = await exchangeCodeForAccessToken({ shop, code });

  const { error } = await supabase.from("shops").upsert(
    {
      user_id: data.user.id,
      shop_domain: shop,
      access_token: token.access_token,
    },
    { onConflict: "user_id,shop_domain" }
  );

  cookieStore.set("shopify_oauth_state", "", { path: "/", maxAge: 0 });

  if (error) {
    return NextResponse.redirect(new URL("/dashboard/connect-shopify?error=db", url));
  }

  return NextResponse.redirect(new URL("/dashboard?shopify=connected", url));
}

