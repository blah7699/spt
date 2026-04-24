create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  subscription_status text not null default 'inactive',
  current_period_end timestamptz,
  price_id text,
  updated_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;

create policy "billing_customers: user can read own"
on public.billing_customers
for select
using (auth.uid() = user_id);

