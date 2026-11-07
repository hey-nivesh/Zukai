-- ==============================================================================
-- Migration 006: Usage Events & Audit Logs
-- Project: Zukai Audio Learning App
-- Description: Append-only event metering and SOC2-ready immutable audit logging
-- ==============================================================================

-- 1. Usage Events Table (Append-only metering)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  job_id uuid references public.audio_jobs(id) on delete set null,
  event_type text not null check (event_type in ('audio_minutes', 'document', 'tokens', 'tts_chars')),
  quantity numeric not null check (quantity > 0),
  created_at timestamptz not null default now()
);

-- Indexes on usage_events
create index if not exists idx_usage_events_owner_created on public.usage_events (owner_id, created_at);
create index if not exists idx_usage_events_org_created on public.usage_events (org_id, created_at);
create index if not exists idx_usage_events_job_id on public.usage_events (job_id);

-- 2. Audit Logs Table (Append-only compliance logging)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  org_id uuid references public.organizations(id) on delete cascade,
  action text not null check (length(trim(action)) >= 1 and length(action) <= 100),
  entity_type text not null check (length(trim(entity_type)) >= 1 and length(entity_type) <= 100),
  entity_id text check (entity_id is null or length(entity_id) <= 100),
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

-- Indexes on audit_logs
create index if not exists idx_audit_logs_actor_created on public.audit_logs (actor_id, created_at desc);
create index if not exists idx_audit_logs_org_created on public.audit_logs (org_id, created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

-- 3. Security Definer function to safely write audit logs
create or replace function private.write_audit_log(
  p_actor_id uuid,
  p_org_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_metadata jsonb default '{}'::jsonb,
  p_ip inet default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_log_id uuid;
begin
  insert into public.audit_logs (
    actor_id,
    org_id,
    action,
    entity_type,
    entity_id,
    metadata,
    ip
  ) values (
    p_actor_id,
    p_org_id,
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb),
    p_ip
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

