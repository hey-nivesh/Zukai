-- ==============================================================================
-- Migration 005: Documents & Audio Processing Entities
-- Project: Zukai Audio Learning App
-- Description: Core tables for documents, audio jobs, tracks, chapters, transcripts, and playback progress
-- ==============================================================================

-- 1. Documents Table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) >= 1 and length(title) <= 255),
  original_filename text not null check (length(original_filename) >= 1 and length(original_filename) <= 255),
  mime_type text not null check (length(mime_type) <= 100),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  storage_path text not null,
  page_count int check (page_count is null or page_count >= 0),
  word_count int check (word_count is null or word_count >= 0),
  source_language text check (source_language is null or length(source_language) <= 20),
  status public.doc_status not null default 'uploaded',
  error_code text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for documents.updated_at
drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

-- Indexes on documents
create index if not exists idx_documents_owner_created on public.documents (owner_id, created_at desc);
create index if not exists idx_documents_org_created on public.documents (org_id, created_at desc);
create index if not exists idx_documents_status_deleted on public.documents (status, deleted_at);
create index if not exists idx_documents_deleted_at on public.documents (deleted_at) where deleted_at is not null;

-- 2. Audio Jobs Table
create table if not exists public.audio_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  language public.audio_language not null default 'english',
  depth public.depth_mode not null default 'standard',
  voice text not null default 'alloy' check (length(voice) <= 50),
  status public.job_status not null default 'queued',
  progress smallint not null default 0 check (progress >= 0 and progress <= 100),
  current_step text check (current_step is null or length(current_step) <= 100),
  error_code text,
  error_message text,
  attempt_count smallint not null default 0 check (attempt_count >= 0),
  input_tokens int not null default 0 check (input_tokens >= 0),
  output_tokens int not null default 0 check (output_tokens >= 0),
  tts_characters int not null default 0 check (tts_characters >= 0),
  cost_micros bigint not null default 0 check (cost_micros >= 0),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for audio_jobs.updated_at
drop trigger if exists set_audio_jobs_updated_at on public.audio_jobs;
create trigger set_audio_jobs_updated_at
  before update on public.audio_jobs
  for each row execute function public.handle_updated_at();

-- Indexes on audio_jobs
create index if not exists idx_audio_jobs_owner_created on public.audio_jobs (owner_id, created_at desc);
create index if not exists idx_audio_jobs_org_created on public.audio_jobs (org_id, created_at desc);
create index if not exists idx_audio_jobs_document_id on public.audio_jobs (document_id);
create index if not exists idx_audio_jobs_status on public.audio_jobs (status);

-- 3. Audio Tracks Table
create table if not exists public.audio_tracks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.audio_jobs(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  storage_path text not null,
  duration_seconds int not null check (duration_seconds > 0),
  format text not null default 'm4a' check (format in ('m4a', 'mp3', 'aac')),
  bitrate_kbps smallint not null default 128 check (bitrate_kbps > 0),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  created_at timestamptz not null default now()
);

-- Indexes on audio_tracks
create index if not exists idx_audio_tracks_owner_created on public.audio_tracks (owner_id, created_at desc);
create index if not exists idx_audio_tracks_org_created on public.audio_tracks (org_id, created_at desc);
create index if not exists idx_audio_tracks_document_id on public.audio_tracks (document_id);

-- 4. Chapters Table
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.audio_tracks(id) on delete cascade,
  position int not null check (position >= 0),
  title text not null check (length(trim(title)) >= 1 and length(title) <= 255),
  start_seconds numeric(8, 2) not null check (start_seconds >= 0),
  end_seconds numeric(8, 2) not null,
  summary text,
  unique (track_id, position),
  constraint chk_chapters_time_order check (end_seconds > start_seconds)
);

create index if not exists idx_chapters_track_id on public.chapters (track_id, position);

-- 5. Transcripts Table
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null unique references public.audio_tracks(id) on delete cascade,
  language public.audio_language not null default 'english',
  segments jsonb not null check (jsonb_typeof(segments) = 'array'),
  full_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_transcripts_track_id on public.transcripts (track_id);

-- 6. Playback Progress Table
create table if not exists public.playback_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.audio_tracks(id) on delete cascade,
  position_seconds numeric(8, 2) not null default 0 check (position_seconds >= 0),
  speed numeric(3, 2) not null default 1.00 check (speed >= 0.50 and speed <= 3.00),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

-- Trigger for playback_progress.updated_at
drop trigger if exists set_playback_progress_updated_at on public.playback_progress;
create trigger set_playback_progress_updated_at
  before update on public.playback_progress
  for each row execute function public.handle_updated_at();

create index if not exists idx_playback_progress_user_updated on public.playback_progress (user_id, updated_at desc);
create index if not exists idx_playback_progress_track on public.playback_progress (track_id);

