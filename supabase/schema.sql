create extension if not exists "pgcrypto";

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_domain text not null,
  access_token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, shop_domain)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  shopify_order_id bigint not null,
  currency text not null,
  revenue_cents bigint not null,
  processed_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (shop_id, shopify_order_id)
);

create table if not exists public.costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  kind text not null check (kind in ('product', 'ad_spend')),
  amount_cents bigint not null check (amount_cents >= 0),
  notes text,
  incurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.shops enable row level security;
alter table public.orders enable row level security;
alter table public.costs enable row level security;

create policy "shops: user can manage own"
on public.shops
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "orders: user can manage own"
on public.orders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "costs: user can manage own"
on public.costs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

