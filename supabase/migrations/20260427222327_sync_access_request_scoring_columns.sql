alter table public.access_requests
  add column if not exists source text not null default 'landing_page',
  add column if not exists status text not null default 'new',
  add column if not exists score integer not null default 0,
  add column if not exists priority text not null default 'unreviewed',
  add column if not exists scoring_reasons jsonb not null default '[]'::jsonb,
  add column if not exists reviewed_at timestamptz;

create index if not exists access_requests_status_idx
  on public.access_requests (status);

create index if not exists access_requests_priority_idx
  on public.access_requests (priority);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'access_requests_status_valid'
      and conrelid = 'public.access_requests'::regclass
  ) then
    alter table public.access_requests
      add constraint access_requests_status_valid
      check (status in ('new', 'reviewing', 'approved', 'rejected', 'archived'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'access_requests_priority_valid'
      and conrelid = 'public.access_requests'::regclass
  ) then
    alter table public.access_requests
      add constraint access_requests_priority_valid
      check (priority in ('unreviewed', 'low', 'medium', 'high'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'access_requests_score_range'
      and conrelid = 'public.access_requests'::regclass
  ) then
    alter table public.access_requests
      add constraint access_requests_score_range
      check (score >= 0 and score <= 100);
  end if;
end $$;

notify pgrst, 'reload schema';
