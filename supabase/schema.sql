-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists orders (
  id bigint generated always as identity primary key,
  session_id text not null unique,
  pass_key text not null,
  pass_name text not null,
  quantity integer not null,
  amount_total integer not null,
  currency text not null,
  customer_email text,
  customer_name text,
  customer_phone text,
  payment_intent_id text,
  invoice_number text not null default '',
  created_at timestamptz not null default now()
);

-- RLS is enabled with no policies, so the table is unreachable via the
-- anon/public REST API. The app talks to Supabase using the service_role
-- key (server-only — never in a NEXT_PUBLIC_ env var or client bundle),
-- which bypasses RLS by design.
alter table orders enable row level security;
