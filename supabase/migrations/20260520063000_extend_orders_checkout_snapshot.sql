alter table public.orders
  add column if not exists shipping_address jsonb,
  add column if not exists artwork_urls text[] not null default '{}',
  add column if not exists item_details jsonb not null default '[]'::jsonb,
  add column if not exists total_amount numeric not null default 0,
  add column if not exists stripe_session_id text;

create index if not exists orders_stripe_session_id_idx on public.orders(stripe_session_id);
