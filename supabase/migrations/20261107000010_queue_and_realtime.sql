-- ==============================================================================
-- Migration 010: Job Queue, Worker Service RPCs & Realtime Publication
-- Project: Zukai Audio Learning App
-- Description: pgmq queue integration, service-role worker RPCs, and Realtime for audio_jobs
-- ==============================================================================

-- 1. Helper function for enqueueing audio jobs
create or replace function private.enqueue_audio_job(p_job_id uuid, p_document_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from pg_extension where extname = 'pgmq') then
    execute 'select pgmq.send($1, $2)'
      using 'audio_jobs', jsonb_build_object('job_id', p_job_id, 'document_id', p_document_id);
    return 1;
  end if;
  return 0;
exception when others then
  return 0;
end;
$$;

-- Update create_audio_job to invoke private.enqueue_audio_job
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

  -- Enqueue job for background processing
  perform private.enqueue_audio_job(v_job.id, p_document_id);

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

-- ==============================================================================
-- 2. Worker Service-Role RPCs (For Fastify Backend Worker in Phase 6)
-- ==============================================================================

-- RPC: claim_next_job (Service Role Only)
create or replace function public.claim_next_job(p_vt_seconds int default 600)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.audio_jobs;
  v_doc public.documents;
begin
  if auth.role() != 'service_role' and current_user != 'postgres' then
    raise exception 'ACCESS_DENIED: Service role execution required' using errcode = 'P0012';
  end if;

  -- Atomically pick oldest queued job
  select * into v_job
  from public.audio_jobs
  where status = 'queued'
  order by created_at asc
  limit 1
  for update skip locked;

  if not found then
    return null;
  end if;

  update public.audio_jobs
  set status = 'extracting',
      started_at = coalesce(started_at, now()),
      attempt_count = attempt_count + 1,
      current_step = 'Extracting document text',
      updated_at = now()
  where id = v_job.id;

  select * into v_doc from public.documents where id = v_job.document_id;

  return jsonb_build_object(
    'job_id', v_job.id,
    'document_id', v_job.document_id,
    'owner_id', v_job.owner_id,
    'org_id', v_job.org_id,
    'language', v_job.language,
    'depth', v_job.depth,
    'voice', v_job.voice,
    'attempt_count', v_job.attempt_count + 1,
    'document_storage_path', v_doc.storage_path,
    'mime_type', v_doc.mime_type,
    'file_size_bytes', v_doc.file_size_bytes
  );
end;
$$;

-- RPC: heartbeat_job (Service Role Only)
create or replace function public.heartbeat_job(
  p_job_id uuid,
  p_progress smallint default null,
  p_current_step text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() != 'service_role' and current_user != 'postgres' then
    raise exception 'ACCESS_DENIED: Service role execution required' using errcode = 'P0012';
  end if;

  update public.audio_jobs
  set progress = coalesce(p_progress, progress),
      current_step = coalesce(p_current_step, current_step),
      updated_at = now()
  where id = p_job_id;

  return true;
end;
$$;

-- RPC: fail_job (Service Role Only)
create or replace function public.fail_job(
  p_job_id uuid,
  p_error_code text,
  p_error_message text
)
returns public.audio_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.audio_jobs;
begin
  if auth.role() != 'service_role' and current_user != 'postgres' then
    raise exception 'ACCESS_DENIED: Service role execution required' using errcode = 'P0012';
  end if;

  select * into v_job from public.audio_jobs where id = p_job_id;
  if not found then
    raise exception 'JOB_NOT_FOUND: Audio job does not exist' using errcode = 'P0014';
  end if;

  if v_job.attempt_count < 3 then
    -- Transient retry: re-queue with backoff step note
    update public.audio_jobs
    set status = 'queued',
        error_code = p_error_code,
        error_message = p_error_message,
        current_step = 'Retrying after transient glitch (attempt ' || v_job.attempt_count || '/3)',
        updated_at = now()
    where id = p_job_id
    returning * into v_job;
  else
    -- Terminal failure
    update public.audio_jobs
    set status = 'failed',
        error_code = p_error_code,
        error_message = p_error_message,
        current_step = 'Failed permanently after 3 attempts',
        finished_at = now(),
        updated_at = now()
    where id = p_job_id
    returning * into v_job;

    -- Audit log failure
    perform private.write_audit_log(
      v_job.owner_id,
      v_job.org_id,
      'job.failed',
      'audio_job',
      p_job_id::text,
      jsonb_build_object('error_code', p_error_code, 'error_message', p_error_message)
    );
  end if;

  return v_job;
end;
$$;

-- RPC: complete_job (Service Role Only)
create or replace function public.complete_job(
  p_job_id uuid,
  p_storage_path text,
  p_duration_seconds int,
  p_format text,
  p_bitrate_kbps int,
  p_file_size_bytes bigint,
  p_chapters jsonb default '[]'::jsonb,
  p_transcripts jsonb default '[]'::jsonb,
  p_input_tokens int default 0,
  p_output_tokens int default 0,
  p_tts_characters int default 0,
  p_cost_micros bigint default 0
)
returns public.audio_tracks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.audio_jobs;
  v_track public.audio_tracks;
  v_chapter jsonb;
  v_transcript jsonb;
  v_full_text text := '';
  v_minutes_used numeric;
begin
  if auth.role() != 'service_role' and current_user != 'postgres' then
    raise exception 'ACCESS_DENIED: Service role execution required' using errcode = 'P0012';
  end if;

  select * into v_job from public.audio_jobs where id = p_job_id;
  if not found then
    raise exception 'JOB_NOT_FOUND: Audio job does not exist' using errcode = 'P0014';
  end if;

  -- 1. Insert Audio Track
  insert into public.audio_tracks (
    job_id,
    document_id,
    owner_id,
    org_id,
    storage_path,
    duration_seconds,
    format,
    bitrate_kbps,
    file_size_bytes
  ) values (
    p_job_id,
    v_job.document_id,
    v_job.owner_id,
    v_job.org_id,
    p_storage_path,
    p_duration_seconds,
    p_format,
    p_bitrate_kbps,
    p_file_size_bytes
  )
  returning * into v_track;

  -- 2. Insert Chapters
  if p_chapters is not null and jsonb_typeof(p_chapters) = 'array' then
    for v_chapter in select * from jsonb_array_elements(p_chapters) loop
      insert into public.chapters (
        track_id,
        position,
        title,
        start_seconds,
        end_seconds,
        summary
      ) values (
        v_track.id,
        (v_chapter->>'position')::int,
        v_chapter->>'title',
        (v_chapter->>'start_seconds')::numeric,
        (v_chapter->>'end_seconds')::numeric,
        v_chapter->>'summary'
      );
    end loop;
  end if;

  -- 3. Insert Transcripts
  if p_transcripts is not null and jsonb_typeof(p_transcripts) = 'array' then
    -- Combine segment text into full text
    select string_agg(elem->>'text', ' ') into v_full_text
    from jsonb_array_elements(p_transcripts) elem;

    insert into public.transcripts (
      track_id,
      language,
      segments,
      full_text
    ) values (
      v_track.id,
      v_job.language,
      p_transcripts,
      coalesce(v_full_text, '')
    );
  end if;

  -- 4. Mark Job as Ready
  update public.audio_jobs
  set status = 'ready',
      progress = 100,
      current_step = 'Completed successfully',
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      tts_characters = p_tts_characters,
      cost_micros = p_cost_micros,
      finished_at = now(),
      updated_at = now()
  where id = p_job_id;

  -- 5. Mark Document as Ready
  update public.documents
  set status = 'ready',
      updated_at = now()
  where id = v_job.document_id;

  -- 6. Record Metered Usage Event
  v_minutes_used := round((p_duration_seconds::numeric / 60.0), 2);
  insert into public.usage_events (
    owner_id,
    org_id,
    job_id,
    event_type,
    quantity
  ) values (
    v_job.owner_id,
    v_job.org_id,
    p_job_id,
    'audio_minutes',
    v_minutes_used
  );

  -- 7. Audit Log Completion
  perform private.write_audit_log(
    v_job.owner_id,
    v_job.org_id,
    'job.completed',
    'audio_job',
    p_job_id::text,
    jsonb_build_object(
      'track_id', v_track.id,
      'duration_seconds', p_duration_seconds,
      'minutes_used', v_minutes_used
    )
  );

  return v_track;
end;
$$;

-- 3. Enable Realtime on audio_jobs
do $$ begin
  alter publication supabase_realtime add table public.audio_jobs;
exception when others then
  raise notice 'Publication supabase_realtime addition note: %', sqlerrm;
end $$;

