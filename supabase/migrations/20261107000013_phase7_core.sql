-- ==============================================================================
-- Migration 013: Phase 7 Core — Bookmarks, Favorites, Upgrade Interest & Stats RPC
-- Project: Zukai Audio Learning App (Phase 7)
-- ==============================================================================

-- 1. Bookmarks Table
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.audio_tracks(id) on delete cascade,
  position_seconds numeric(8, 2) not null check (position_seconds >= 0),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_bookmarks_track on public.bookmarks(track_id);
create index if not exists idx_bookmarks_created_at on public.bookmarks(created_at desc);

alter table public.bookmarks enable row level security;

create policy "Users can read own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

create or replace trigger set_bookmarks_timestamp
  before update on public.bookmarks
  for each row
  execute function public.handle_updated_at();

-- 2. Document Favorites Table
create table if not exists public.document_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create index if not exists idx_document_favorites_user on public.document_favorites(user_id);
create index if not exists idx_document_favorites_doc on public.document_favorites(document_id);

alter table public.document_favorites enable row level security;

create policy "Users can read own favorites"
  on public.document_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.document_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.document_favorites for delete
  using (auth.uid() = user_id);

-- 3. Upgrade Interests Table
create table if not exists public.upgrade_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  plan_tier text not null default 'pro',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_upgrade_interests_user on public.upgrade_interests(user_id);
alter table public.upgrade_interests enable row level security;

create policy "Users can insert own upgrade interest"
  on public.upgrade_interests for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Service role has full access to upgrade interests"
  on public.upgrade_interests for all
  using (auth.role() = 'service_role' or current_user = 'postgres');

-- 4. Learning Stats RPC
create or replace function public.get_learning_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_total_minutes numeric := 0.0;
  v_tracks_completed int := 0;
  v_streak_days int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object(
      'total_minutes', 0,
      'tracks_completed', 0,
      'streak_days', 0
    );
  end if;

  -- 1. Total minutes listened
  select coalesce(round(sum(position_seconds) / 60.0, 1), 0.0)
    into v_total_minutes
    from public.playback_progress
   where user_id = v_user_id;

  -- 2. Tracks completed
  select count(*)
    into v_tracks_completed
    from public.playback_progress
   where user_id = v_user_id
     and is_completed = true;

  -- 3. Streak days (consecutive distinct days with activity up to today)
  with active_days as (
    select distinct date_trunc('day', updated_at at time zone 'UTC')::date as act_date
      from public.playback_progress
     where user_id = v_user_id
  ),
  ordered_days as (
    select act_date,
           row_number() over (order by act_date desc) as rn
      from active_days
  )
  select count(*)
    into v_streak_days
    from ordered_days
   where act_date >= current_date - interval '1 day' * (rn - 1);

  return jsonb_build_object(
    'total_minutes', coalesce(v_total_minutes, 0.0),
    'tracks_completed', coalesce(v_tracks_completed, 0),
    'streak_days', greatest(coalesce(v_streak_days, 0), 1)
  );
end;
$$;

