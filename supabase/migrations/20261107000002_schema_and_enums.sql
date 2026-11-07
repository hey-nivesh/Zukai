-- ==============================================================================
-- Migration 002: Private Schema & Core Enums
-- Project: Zukai Audio Learning App
-- Description: Creates private schema for security definer helpers & defines domain enums
-- ==============================================================================

-- 1. Private schema (hidden from PostgREST API)
create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to postgres, service_role;

-- 2. Domain Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'org_role') then
    create type public.org_role as enum ('owner', 'admin', 'member');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'doc_status') then
    create type public.doc_status as enum ('uploading', 'uploaded', 'ready', 'failed', 'deleted');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum (
      'queued',
      'extracting',
      'scripting',
      'voicing',
      'assembling',
      'ready',
      'failed',
      'canceled'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'audio_language') then
    create type public.audio_language as enum ('english', 'hinglish');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'depth_mode') then
    create type public.depth_mode as enum ('quick', 'standard', 'deep');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'plan_tier') then
    create type public.plan_tier as enum ('free', 'pro', 'team', 'enterprise');
  end if;
end $$;

