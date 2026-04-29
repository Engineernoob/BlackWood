create extension if not exists pgcrypto;

create table if not exists public.polar_webhook_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  webhook_id text unique not null,
  event_type text not null,
  polar_resource_id text,
  processed boolean not null default false,
  payload jsonb not null
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text,
  email text unique not null,
  organization text,
  polar_customer_id text,
  polar_subscription_id text,
  polar_product_id text,
  polar_price_id text,
  status text not null default 'active',
  tier text,
  onboarding_status text not null default 'pending',
  source text not null default 'polar',

  constraint clients_status_valid check (
    status in ('active', 'trialing', 'past_due', 'canceled', 'revoked', 'inactive')
  ),
  constraint clients_onboarding_status_valid check (
    onboarding_status in ('pending', 'in_progress', 'complete', 'paused')
  )
);

create table if not exists public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  due_at timestamptz,

  constraint onboarding_tasks_status_valid check (
    status in ('pending', 'in_progress', 'complete', 'skipped')
  )
);

create index if not exists polar_webhook_events_webhook_id_idx
  on public.polar_webhook_events (webhook_id);

create index if not exists polar_webhook_events_event_type_idx
  on public.polar_webhook_events (event_type);

create index if not exists clients_email_idx
  on public.clients (email);

create index if not exists clients_polar_customer_id_idx
  on public.clients (polar_customer_id);

create index if not exists clients_polar_subscription_id_idx
  on public.clients (polar_subscription_id);

create index if not exists clients_status_idx
  on public.clients (status);

create index if not exists onboarding_tasks_client_id_idx
  on public.onboarding_tasks (client_id);

alter table public.polar_webhook_events enable row level security;
alter table public.clients enable row level security;
alter table public.onboarding_tasks enable row level security;

drop policy if exists "Authenticated users can read polar webhook events" on public.polar_webhook_events;
create policy "Authenticated users can read polar webhook events"
on public.polar_webhook_events
for select
to authenticated
using (true);

drop policy if exists "Authenticated users manage clients" on public.clients;
create policy "Authenticated users manage clients"
on public.clients
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users manage onboarding tasks" on public.onboarding_tasks;
create policy "Authenticated users manage onboarding tasks"
on public.onboarding_tasks
for all
to authenticated
using (true)
with check (true);

comment on table public.polar_webhook_events is
'Idempotent Polar webhook delivery log keyed by webhook-id header.';

comment on table public.clients is
'Paying Blackwood client records created from Polar payment and subscription events.';

comment on table public.onboarding_tasks is
'Operator onboarding checklist generated when a Polar payment or active subscription is received.';
