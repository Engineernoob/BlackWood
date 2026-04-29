-- Blackwood Access Requests Backend
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  full_name text not null,
  role text not null,
  organization text,
  email text not null,
  scope text,
  note text,

  source text not null default 'landing_page',
  status text not null default 'new',

  score integer not null default 0,
  priority text not null default 'unreviewed',
  scoring_reasons jsonb not null default '[]'::jsonb,

  reviewed_at timestamptz,

  constraint access_requests_full_name_not_empty check (length(trim(full_name)) > 0),
  constraint access_requests_role_not_empty check (length(trim(role)) > 0),
  constraint access_requests_email_valid check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint access_requests_status_valid check (
    status in ('new', 'reviewing', 'approved', 'rejected', 'archived')
  ),
  constraint access_requests_priority_valid check (
    priority in ('unreviewed', 'low', 'medium', 'high')
  ),
  constraint access_requests_score_range check (score >= 0 and score <= 100)
);

create index if not exists access_requests_created_at_idx
  on public.access_requests (created_at desc);

create index if not exists access_requests_email_idx
  on public.access_requests (email);

create index if not exists access_requests_status_idx
  on public.access_requests (status);

create index if not exists access_requests_priority_idx
  on public.access_requests (priority);

alter table public.access_requests enable row level security;

drop policy if exists "Public can insert access requests" on public.access_requests;
create policy "Public can insert access requests"
on public.access_requests
for insert
to anon
with check (true);

drop policy if exists "Authenticated users can read access requests" on public.access_requests;
create policy "Authenticated users can read access requests"
on public.access_requests
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can update access requests" on public.access_requests;
create policy "Authenticated users can update access requests"
on public.access_requests
for update
to authenticated
using (true)
with check (true);

comment on table public.access_requests is
'Private Blackwood access intake requests. Public insert only; private review via authenticated admin.';
