import crypto from "crypto";

export function normalizeShopDomain(input: string) {
  const s = input.trim().toLowerCase();
  const withoutProtocol = s.replace(/^https?:\/\//, "");
  const withoutPath = (withoutProtocol.split("/")[0] ?? "").trim();
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(withoutPath)) return null;
  return withoutPath;
}

export function createOAuthState() {
  return crypto.randomBytes(16).toString("hex");
}

export function buildShopifyAuthUrl(params: {
  shop: string;
  state: string;
  redirectUri: string;
  scopes: string;
}) {
  const url = new URL(`https://${params.shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", process.env.SHOPIFY_API_KEY!);
  url.searchParams.set("scope", params.scopes);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  return url.toString();
}

export function verifyShopifyHmac(searchParams: URLSearchParams) {
  const secret = process.env.SHOPIFY_API_SECRET!;
  const hmac = searchParams.get("hmac");
  if (!hmac) return false;

  const entries: Array<[string, string]> = [];
  for (const [k, v] of searchParams.entries()) {
    if (k === "hmac" || k === "signature") continue;
    entries.push([k, v]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const message = new URLSearchParams(entries).toString();

  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmac, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function exchangeCodeForAccessToken(params: { shop: string; code: string }) {
  const res = await fetch(`https://${params.shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY!,
      client_secret: process.env.SHOPIFY_API_SECRET!,
      code: params.code,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as { access_token: string; scope: string };
}

