export async function shopifyAdminFetch(params: {
  shopDomain: string;
  accessToken: string;
  path: string;
}) {
  const res = await fetch(`https://${params.shopDomain}${params.path}`, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": params.accessToken,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API failed: ${res.status} ${text}`);
  }

  return res;
}

