create extension if not exists pgcrypto;

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  role text,
  company text,
  email text,
  source_url text,
  public_signals jsonb not null default '[]'::jsonb,
  fit_score integer not null default 0,
  reason_matched text,
  recommended_approach text,
  status text not null default 'new',

  constraint prospects_fit_score_range check (fit_score >= 0 and fit_score <= 100),
  constraint prospects_status_valid check (
    status in ('new', 'ranked', 'drafted', 'approved', 'contacted', 'replied', 'archived', 'do_not_contact')
  )
);

create table if not exists public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete cascade,
  created_at timestamptz not null default now(),
  type text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft',
  resend_email_id text,
  sent_at timestamptz,

  constraint outreach_drafts_type_valid check (
    type in ('direct_outreach', 'intro_request', 'follow_up', 'onboarding_call_invitation')
  ),
  constraint outreach_drafts_status_valid check (
    status in ('draft', 'approved', 'discarded', 'sent', 'failed')
  )
);

create table if not exists public.email_threads (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  status text not null default 'open',
  sentiment text,
  intent text,
  requires_approval boolean not null default true,

  constraint email_threads_status_valid check (
    status in ('open', 'awaiting_approval', 'auto_replied', 'archived', 'do_not_contact')
  )
);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.email_threads(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  created_at timestamptz not null default now(),
  direction text not null,
  from_email text,
  to_email text,
  subject text,
  body text,
  resend_email_id text,
  classification jsonb not null default '{}'::jsonb,

  constraint email_messages_direction_valid check (
    direction in ('inbound', 'outbound')
  )
);

create table if not exists public.reply_drafts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.email_threads(id) on delete cascade,
  created_at timestamptz not null default now(),
  body text not null,
  status text not null default 'draft',
  requires_approval boolean not null default true,

  constraint reply_drafts_status_valid check (
    status in ('draft', 'approved', 'sent', 'discarded', 'auto_sent')
  )
);

create index if not exists prospects_created_at_idx
  on public.prospects (created_at desc);

create index if not exists prospects_status_idx
  on public.prospects (status);

create index if not exists prospects_fit_score_idx
  on public.prospects (fit_score desc);

create index if not exists outreach_drafts_status_idx
  on public.outreach_drafts (status);

create index if not exists outreach_drafts_prospect_id_idx
  on public.outreach_drafts (prospect_id);

create index if not exists email_threads_prospect_id_idx
  on public.email_threads (prospect_id);

create index if not exists email_threads_status_idx
  on public.email_threads (status);

create index if not exists email_messages_thread_id_idx
  on public.email_messages (thread_id);

create index if not exists email_messages_resend_email_id_idx
  on public.email_messages (resend_email_id);

create index if not exists reply_drafts_thread_id_idx
  on public.reply_drafts (thread_id);

alter table public.prospects enable row level security;
alter table public.outreach_drafts enable row level security;
alter table public.email_threads enable row level security;
alter table public.email_messages enable row level security;
alter table public.reply_drafts enable row level security;

drop policy if exists "Authenticated users manage prospects" on public.prospects;
create policy "Authenticated users manage prospects"
on public.prospects
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users manage outreach drafts" on public.outreach_drafts;
create policy "Authenticated users manage outreach drafts"
on public.outreach_drafts
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users manage email threads" on public.email_threads;
create policy "Authenticated users manage email threads"
on public.email_threads
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users manage email messages" on public.email_messages;
create policy "Authenticated users manage email messages"
on public.email_messages
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users manage reply drafts" on public.reply_drafts;
create policy "Authenticated users manage reply drafts"
on public.reply_drafts
for all
to authenticated
using (true)
with check (true);

comment on table public.prospects is
'Private Blackwood outbound prospect records. Public-data context only.';

comment on table public.outreach_drafts is
'Operator-approved outbound drafts. First-touch messages must not be sent automatically.';

comment on table public.email_threads is
'Tracked inbound reply threads and AI classification state.';

comment on table public.email_messages is
'Inbound and outbound email message log for Blackwood outreach.';

comment on table public.reply_drafts is
'AI-generated response drafts with approval requirements.';
