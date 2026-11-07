-- ==============================================================================
-- Migration 007: Helper Functions & Public RPCs
-- Project: Zukai Audio Learning App
-- Description: Security definer helpers, quota evaluation, and transactional public RPCs
-- ==============================================================================

-- 1. Private Helper Functions (Security Definer, search_path = '')

-- Check if current authenticated user is an active member of an organization
create or replace function private.is_org_member(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.memberships
    where org_id = p_org_id
      and user_id = (select auth.uid())
  );
$$;

-- Get current authenticated user's role in an organization
create or replace function private.org_role(p_org_id uuid)
returns public.org_role
language sql
security definer
set search_path = ''
stable
as $$
  select role
  from public.memberships
  where org_id = p_org_id
    and user_id = (select auth.uid())
  limit 1;
$$;

-- Check if current authenticated user can manage the organization (owner or admin)
create or replace function private.can_manage_org(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.memberships
    where org_id = p_org_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

-- Check if current authenticated user can access a document
create or replace function private.can_access_document(p_document_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and (
        d.owner_id = (select auth.uid())
        or (d.org_id is not null and private.is_org_member(d.org_id))
      )
  );
$$;

-- 2. Quota Check Function
create or replace function private.check_quota(
  p_owner_id uuid,
  p_org_id uuid default null,
  p_requested_minutes numeric default 0,
  p_file_size_bytes bigint default 0,
  p_pages int default 0
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.plan_tier := 'free';
  v_plan record;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_used_minutes numeric := 0;
  v_doc_count int := 0;
begin
  -- Resolve effective tier
  if p_org_id is not null then
    select coalesce(o.plan_tier, 'free') into v_tier
    from public.organizations o
    where o.id = p_org_id;
  else
    select coalesce(s.tier, 'free'), s.current_period_end
    into v_tier, v_period_end
    from public.subscriptions s
    where s.user_id = p_owner_id
      and s.status in ('active', 'trial')
    order by s.created_at desc
    limit 1;
  end if;

  v_tier := coalesce(v_tier, 'free');

  -- Get plan limits
  select * into v_plan
  from public.plans
  where tier = v_tier;

  if not found then
    raise exception 'UNKNOWN_PLAN_TIER: Plan % is not configured', v_tier
      using errcode = 'P0002';
  end if;

  -- 1. Validate file size
  if p_file_size_bytes > 0 and p_file_size_bytes > (v_plan.max_file_size_mb::bigint * 1024 * 1024) then
    raise exception 'QUOTA_EXCEEDED: File size exceeds the % MB limit for % tier', v_plan.max_file_size_mb, v_tier
      using errcode = 'P0003';
  end if;

  -- 2. Validate pages
  if p_pages > 0 and p_pages > v_plan.max_pages then
    raise exception 'QUOTA_EXCEEDED: Document has % pages which exceeds the % page limit for % tier', p_pages, v_plan.max_pages, v_tier
      using errcode = 'P0004';
  end if;

  -- 3. Calculate billing period
  if v_tier = 'free' or v_period_end is null then
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  else
    v_period_start := v_period_end - interval '1 month';
  end if;

  -- 4. Calculate audio minutes consumed in this period
  if p_org_id is not null then
    select coalesce(sum(quantity), 0) into v_used_minutes
    from public.usage_events
    where org_id = p_org_id
      and event_type = 'audio_minutes'
      and created_at >= v_period_start
      and created_at < v_period_end;
  else
    select coalesce(sum(quantity), 0) into v_used_minutes
    from public.usage_events
    where owner_id = p_owner_id
      and org_id is null
      and event_type = 'audio_minutes'
      and created_at >= v_period_start
      and created_at < v_period_end;
  end if;

  if (v_used_minutes + p_requested_minutes) > v_plan.monthly_audio_minutes then
    raise exception 'QUOTA_EXCEEDED: Monthly audio limit of % minutes reached (% minutes used)', v_plan.monthly_audio_minutes, v_used_minutes
      using errcode = 'P0005';
  end if;

  return true;
end;
$$;

-- 3. Purge soft-deleted documents cron helper
create or replace function private.purge_deleted_documents(p_days int default 30)
returns table (document_id uuid, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with deleted_docs as (
    delete from public.documents
    where deleted_at is not null
      and deleted_at < (now() - (p_days || ' days')::interval)
    returning id, public.documents.storage_path
  )
  select id as document_id, deleted_docs.storage_path from deleted_docs;
end;
$$;

-- ==============================================================================
-- 4. Public RPCs (Callable by Authenticated Users)
-- ==============================================================================

-- RPC: create_organization
create or replace function public.create_organization(
  p_name text,
  p_slug text
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_org public.organizations;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Must be signed in to create an organization'
      using errcode = 'P0006';
  end if;

  if length(trim(p_name)) < 1 or length(p_name) > 100 then
    raise exception 'INVALID_INPUT: Organization name must be between 1 and 100 characters'
      using errcode = 'P0007';
  end if;

  if length(p_slug) < 2 or length(p_slug) > 50 or p_slug !~ '^[a-z0-9-]+$' then
    raise exception 'INVALID_INPUT: Slug must be 2-50 characters of lowercase letters, numbers, and hyphens'
      using errcode = 'P0008';
  end if;

  -- Atomically insert organization
  insert into public.organizations (
    name,
    slug,
    created_by,
    plan_tier
  ) values (
    trim(p_name),
    lower(p_slug),
    v_user_id,
    'free'
  )
  returning * into v_org;

  -- Atomically insert owner membership
  insert into public.memberships (
    org_id,
    user_id,
    role
  ) values (
    v_org.id,
    v_user_id,
    'owner'
  );

  -- Audit log
  perform private.write_audit_log(
    v_user_id,
    v_org.id,
    'org.created',
    'organization',
    v_org.id::text,
    jsonb_build_object('name', v_org.name, 'slug', v_org.slug)
  );

  return v_org;
end;
$$;

-- RPC: create_audio_job
create or replace function public.create_audio_job(
  p_document_id uuid,
  p_language public.audio_language default 'english',
  p_depth public.depth_mode default 'standard',
  p_voice text default 'alloy'
)
returns public.audio_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_doc record;
  v_active_jobs int;
  v_plan record;
  v_tier public.plan_tier;
  v_est_minutes numeric := 15;
  v_job public.audio_jobs;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Authentication required' using errcode = 'P0006';
  end if;

  -- 1. Fetch document & verify access
  select * into v_doc
  from public.documents
  where id = p_document_id;

  if not found then
    raise exception 'DOCUMENT_NOT_FOUND: Document does not exist' using errcode = 'P0009';
  end if;

  if v_doc.deleted_at is not null or v_doc.status = 'deleted' then
    raise exception 'DOCUMENT_DELETED: Cannot generate audio for a deleted document' using errcode = 'P0010';
  end if;

  if v_doc.status = 'failed' then
    raise exception 'DOCUMENT_NOT_READY: Document processing failed; upload a valid file' using errcode = 'P0011';
  end if;

  -- Check user access to document
  if v_doc.owner_id != v_user_id then
    if v_doc.org_id is null or not private.is_org_member(v_doc.org_id) then
      raise exception 'ACCESS_DENIED: You do not have permission to access this document' using errcode = 'P0012';
    end if;
  end if;

  -- 2. Concurrency limit check
  if v_doc.org_id is not null then
    select coalesce(plan_tier, 'free') into v_tier from public.organizations where id = v_doc.org_id;
    select count(*) into v_active_jobs
    from public.audio_jobs
    where org_id = v_doc.org_id
      and status in ('queued', 'extracting', 'scripting', 'voicing', 'assembling');
  else
    select coalesce(tier, 'free') into v_tier
    from public.subscriptions
    where user_id = v_user_id and status in ('active', 'trial')
    limit 1;
    v_tier := coalesce(v_tier, 'free');

    select count(*) into v_active_jobs
    from public.audio_jobs
    where owner_id = v_user_id
      and org_id is null
      and status in ('queued', 'extracting', 'scripting', 'voicing', 'assembling');
  end if;

  select * into v_plan from public.plans where tier = v_tier;

  if v_active_jobs >= v_plan.max_concurrent_jobs then
    raise exception 'TOO_MANY_JOBS: Concurrency limit reached (% max active jobs on % tier)', v_plan.max_concurrent_jobs, v_tier
      using errcode = 'P0013';
  end if;

  -- 3. Estimate minutes by depth
  if p_depth = 'quick' then
    v_est_minutes := 5;
  elsif p_depth = 'standard' then
    v_est_minutes := 15;
  else
    v_est_minutes := 30;
  end if;

  -- 4. Check quota
  perform private.check_quota(
    v_user_id,
    v_doc.org_id,
    v_est_minutes,
    v_doc.file_size_bytes,
    coalesce(v_doc.page_count, 1)
  );

  -- 5. Insert audio job record
  insert into public.audio_jobs (
    document_id,
    owner_id,
    org_id,
    language,
    depth,
    voice,
    status,
    progress,
    current_step
  ) values (
    p_document_id,
    v_user_id,
    v_doc.org_id,
    p_language,
    p_depth,
    trim(p_voice),
    'queued',
    0,
    'Enqueued for processing'
  )
  returning * into v_job;

  -- Audit log
  perform private.write_audit_log(
    v_user_id,
    v_doc.org_id,
    'job.created',
    'audio_job',
    v_job.id::text,
    jsonb_build_object(
      'document_id', p_document_id,
      'language', p_language,
      'depth', p_depth,
      'voice', p_voice
    )
  );

  return v_job;
end;
$$;

-- RPC: cancel_audio_job
create or replace function public.cancel_audio_job(p_job_id uuid)
returns public.audio_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.audio_jobs;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Authentication required' using errcode = 'P0006';
  end if;

  select * into v_job
  from public.audio_jobs
  where id = p_job_id;

  if not found then
    raise exception 'JOB_NOT_FOUND: Audio job does not exist' using errcode = 'P0014';
  end if;

  -- Verify cancel permission (owner or org admin)
  if v_job.owner_id != v_user_id then
    if v_job.org_id is null or not private.can_manage_org(v_job.org_id) then
      raise exception 'ACCESS_DENIED: Only the creator or an org admin can cancel this job'
        using errcode = 'P0012';
    end if;
  end if;

  if v_job.status in ('ready', 'failed', 'canceled') then
    raise exception 'CANNOT_CANCEL: Job is already in a terminal state (%)', v_job.status
      using errcode = 'P0015';
  end if;

  update public.audio_jobs
  set status = 'canceled',
      error_message = 'Canceled by user',
      finished_at = now(),
      updated_at = now()
  where id = p_job_id
  returning * into v_job;

  -- Audit log
  perform private.write_audit_log(
    v_user_id,
    v_job.org_id,
    'job.canceled',
    'audio_job',
    p_job_id::text,
    jsonb_build_object('canceled_status', v_job.status)
  );

  return v_job;
end;
$$;

-- RPC: soft_delete_document
create or replace function public.soft_delete_document(p_document_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_doc record;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Authentication required' using errcode = 'P0006';
  end if;

  select * into v_doc
  from public.documents
  where id = p_document_id;

  if not found then
    raise exception 'DOCUMENT_NOT_FOUND: Document does not exist' using errcode = 'P0009';
  end if;

  if v_doc.owner_id != v_user_id then
    if v_doc.org_id is null or not private.can_manage_org(v_doc.org_id) then
      raise exception 'ACCESS_DENIED: Permission denied to delete this document' using errcode = 'P0012';
    end if;
  end if;

  update public.documents
  set deleted_at = now(),
      status = 'deleted',
      updated_at = now()
  where id = p_document_id;

  -- Audit log
  perform private.write_audit_log(
    v_user_id,
    v_doc.org_id,
    'document.soft_deleted',
    'document',
    p_document_id::text,
    jsonb_build_object('title', v_doc.title)
  );

  return true;
end;
$$;

-- RPC: update_playback_progress
create or replace function public.update_playback_progress(
  p_track_id uuid,
  p_position_seconds numeric,
  p_speed numeric default 1.00,
  p_completed boolean default false
)
returns public.playback_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_progress public.playback_progress;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Authentication required' using errcode = 'P0006';
  end if;

  insert into public.playback_progress (
    user_id,
    track_id,
    position_seconds,
    speed,
    completed,
    updated_at
  ) values (
    v_user_id,
    p_track_id,
    greatest(0, p_position_seconds),
    least(3.0, greatest(0.5, p_speed)),
    p_completed,
    now()
  )
  on conflict (user_id, track_id) do update set
    position_seconds = excluded.position_seconds,
    speed = excluded.speed,
    completed = excluded.completed,
    updated_at = now()
  returning * into v_progress;

  return v_progress;
end;
$$;

-- RPC: get_usage_summary
create or replace function public.get_usage_summary(p_org_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_tier public.plan_tier := 'free';
  v_plan record;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_minutes_used numeric := 0;
  v_doc_count int := 0;
  v_active_jobs int := 0;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Authentication required' using errcode = 'P0006';
  end if;

  if p_org_id is not null then
    if not private.is_org_member(p_org_id) then
      raise exception 'ACCESS_DENIED: Not an organization member' using errcode = 'P0012';
    end if;

    select coalesce(plan_tier, 'free') into v_tier from public.organizations where id = p_org_id;
  else
    select coalesce(tier, 'free'), current_period_end
    into v_tier, v_period_end
    from public.subscriptions
    where user_id = v_user_id and status in ('active', 'trial')
    limit 1;
  end if;

  v_tier := coalesce(v_tier, 'free');
  select * into v_plan from public.plans where tier = v_tier;

  if v_tier = 'free' or v_period_end is null then
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  else
    v_period_start := v_period_end - interval '1 month';
  end if;

  if p_org_id is not null then
    select coalesce(sum(quantity), 0) into v_minutes_used
    from public.usage_events
    where org_id = p_org_id
      and event_type = 'audio_minutes'
      and created_at >= v_period_start
      and created_at < v_period_end;

    select count(*) into v_doc_count
    from public.documents
    where org_id = p_org_id and deleted_at is null;

    select count(*) into v_active_jobs
    from public.audio_jobs
    where org_id = p_org_id and status in ('queued', 'extracting', 'scripting', 'voicing', 'assembling');
  else
    select coalesce(sum(quantity), 0) into v_minutes_used
    from public.usage_events
    where owner_id = v_user_id
      and org_id is null
      and event_type = 'audio_minutes'
      and created_at >= v_period_start
      and created_at < v_period_end;

    select count(*) into v_doc_count
    from public.documents
    where owner_id = v_user_id and org_id is null and deleted_at is null;

    select count(*) into v_active_jobs
    from public.audio_jobs
    where owner_id = v_user_id and org_id is null and status in ('queued', 'extracting', 'scripting', 'voicing', 'assembling');
  end if;

  return jsonb_build_object(
    'tier', v_tier,
    'monthly_audio_minutes_limit', v_plan.monthly_audio_minutes,
    'monthly_audio_minutes_used', v_minutes_used,
    'max_documents_limit', v_plan.max_documents,
    'documents_count', v_doc_count,
    'active_jobs_count', v_active_jobs,
    'period_start', v_period_start,
    'period_end', v_period_end
  );
end;
$$;

