-- ==============================================================================
-- Migration 012: Quality Metadata & User Audio Feedback Loop
-- Project: Zukai Audio Learning App (Phase 7)
-- ==============================================================================

-- 1. Add quality_meta to audio_jobs for auditable prompt & model tracking
alter table public.audio_jobs
add column if not exists quality_meta jsonb default '{}'::jsonb;

comment on column public.audio_jobs.quality_meta is 'Contains prompt_version, model, voice, and pipeline telemetry without private document text';

-- 2. Create audio_feedback table for privacy-safe listener feedback
create table if not exists public.audio_feedback (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.audio_tracks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  is_positive boolean,
  reasons text[] default '{}'::text[],
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_user_track_feedback unique (user_id, track_id)
);

-- Index for analytics and fast retrieval
create index if not exists idx_audio_feedback_track on public.audio_feedback(track_id);
create index if not exists idx_audio_feedback_user on public.audio_feedback(user_id);
create index if not exists idx_audio_feedback_created_at on public.audio_feedback(created_at desc);

-- 3. Row Level Security for audio_feedback
alter table public.audio_feedback enable row level security;

-- Users can read their own feedback
create policy "Users can read own audio feedback"
  on public.audio_feedback
  for select
  using (auth.uid() = user_id);

-- Users can insert their own feedback
create policy "Users can insert own audio feedback"
  on public.audio_feedback
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own feedback
create policy "Users can update own audio feedback"
  on public.audio_feedback
  for update
  using (auth.uid() = user_id);

-- Service role has full access
create policy "Service role has full access to feedback"
  on public.audio_feedback
  for all
  using (auth.role() = 'service_role' or current_user = 'postgres');

-- 4. Audit trigger for updated_at
create or replace trigger set_audio_feedback_timestamp
  before update on public.audio_feedback
  for each row
  execute function public.handle_updated_at();

