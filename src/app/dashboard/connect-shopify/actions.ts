"use server";

import { redirect } from "next/navigation";
import { normalizeShopDomain } from "@/lib/shopify/oauth";

type StartShopifyOAuthState = { error: string };

export async function startShopifyOAuth(
  _: StartShopifyOAuthState,
  formData: FormData
): Promise<StartShopifyOAuthState> {
  const shopInput = String(formData.get("shop") ?? "");
  const shop = normalizeShopDomain(shopInput);
  if (!shop) {
    return {
      error: "Enter a valid myshopify.com domain (e.g. acme.myshopify.com).",
    };
  }
  redirect(`/api/shopify/auth?shop=${encodeURIComponent(shop)}`);
}

