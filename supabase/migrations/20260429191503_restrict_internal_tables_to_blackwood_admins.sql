create schema if not exists private;

create table if not exists public.blackwood_admins (
  email text primary key,
  created_at timestamptz not null default now(),
  active boolean not null default true,

  constraint blackwood_admins_email_lowercase check (email = lower(email)),
  constraint blackwood_admins_email_valid check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

alter table public.blackwood_admins enable row level security;

create or replace function private.is_blackwood_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blackwood_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and active = true
  );
$$;

revoke all on function private.is_blackwood_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_blackwood_admin() to authenticated;

drop policy if exists "Admins can read own admin record" on public.blackwood_admins;
create policy "Admins can read own admin record"
on public.blackwood_admins
for select
to authenticated
using (
  email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "Authenticated users can read access requests" on public.access_requests;
create policy "Blackwood admins can read access requests"
on public.access_requests
for select
to authenticated
using (private.is_blackwood_admin());

drop policy if exists "Authenticated users can update access requests" on public.access_requests;
create policy "Blackwood admins can update access requests"
on public.access_requests
for update
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

drop policy if exists "Authenticated users manage prospects" on public.prospects;
create policy "Blackwood admins manage prospects"
on public.prospects
for all
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

drop policy if exists "Authenticated users manage outreach drafts" on public.outreach_drafts;
create policy "Blackwood admins manage outreach drafts"
on public.outreach_drafts
for all
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

drop policy if exists "Authenticated users manage email threads" on public.email_threads;
create policy "Blackwood admins manage email threads"
on public.email_threads
for all
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

drop policy if exists "Authenticated users manage email messages" on public.email_messages;
create policy "Blackwood admins manage email messages"
on public.email_messages
for all
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

drop policy if exists "Authenticated users manage reply drafts" on public.reply_drafts;
create policy "Blackwood admins manage reply drafts"
on public.reply_drafts
for all
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

drop policy if exists "Authenticated users can read polar webhook events" on public.polar_webhook_events;
create policy "Blackwood admins can read polar webhook events"
on public.polar_webhook_events
for select
to authenticated
using (private.is_blackwood_admin());

drop policy if exists "Authenticated users manage clients" on public.clients;
create policy "Blackwood admins manage clients"
on public.clients
for all
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

drop policy if exists "Authenticated users manage onboarding tasks" on public.onboarding_tasks;
create policy "Blackwood admins manage onboarding tasks"
on public.onboarding_tasks
for all
to authenticated
using (private.is_blackwood_admin())
with check (private.is_blackwood_admin());

comment on table public.blackwood_admins is
'Allowlist of approved Blackwood operator emails used by RLS policies.';
