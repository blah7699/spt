import { shopifyAdminFetch } from "./admin";

export type ShopifyOrder = {
  id: number;
  currency: string;
  total_price: string;
  processed_at: string | null;
  created_at: string;
};

function getNextPageInfo(linkHeader: string | null) {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const p of parts) {
    const [urlPart, relPart] = p.split(";").map((x) => x.trim());
    if (!relPart?.includes('rel="next"')) continue;
    const m = urlPart.match(/^<(.+)>$/);
    if (!m) continue;
    const nextUrl = new URL(m[1]);
    return nextUrl.searchParams.get("page_info");
  }
  return null;
}

export async function fetchAllOrders(params: {
  shopDomain: string;
  accessToken: string;
  apiVersion?: string;
  limit?: number;
}) {
  const apiVersion = params.apiVersion ?? (process.env.SHOPIFY_API_VERSION || "2024-04");
  const limit = params.limit ?? 250;

  const orders: ShopifyOrder[] = [];
  let pageInfo: string | null = null;

  for (;;) {
    const search = new URLSearchParams();
    search.set("limit", String(limit));
    search.set("status", "any");
    search.set("order", "processed_at desc");
    if (pageInfo) search.set("page_info", pageInfo);

    const res = await shopifyAdminFetch({
      shopDomain: params.shopDomain,
      accessToken: params.accessToken,
      path: `/admin/api/${apiVersion}/orders.json?${search.toString()}`,
    });

    const json = (await res.json()) as { orders: ShopifyOrder[] };
    orders.push(...json.orders);

    pageInfo = getNextPageInfo(res.headers.get("link"));
    if (!pageInfo) break;
  }

  return orders;
}

