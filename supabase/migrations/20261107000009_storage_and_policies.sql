-- ==============================================================================
-- Migration 009: Private Storage Buckets & Policies
-- Project: Zukai Audio Learning App
-- Description: Provision private buckets (uploads, audio, avatars) with object-level RLS
-- ==============================================================================

-- 1. Create Private Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'uploads',
    'uploads',
    false,
    262144000, -- 250 MB
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]
  ),
  (
    'audio',
    'audio',
    false,
    104857600, -- 100 MB
    array[
      'audio/mp4',
      'audio/x-m4a',
      'audio/mpeg',
      'audio/aac'
    ]
  ),
  (
    'avatars',
    'avatars',
    false,
    5242880, -- 5 MB
    array[
      'image/png',
      'image/jpeg',
      'image/webp'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Helper functions for storage path evaluation
create or replace function private.can_access_storage_upload(p_path text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parts text[];
  v_owner_id text;
  v_doc_id text;
begin
  v_parts := string_to_array(p_path, '/');
  if array_length(v_parts, 1) < 2 then
    return false;
  end if;
  v_owner_id := v_parts[1];
  v_doc_id := v_parts[2];

  -- If user is the owner
  if v_owner_id = (select auth.uid())::text then
    return true;
  end if;

  -- If valid UUID for document, check if org member can access it
  if v_doc_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return private.can_access_document(v_doc_id::uuid);
  end if;

  return false;
end;
$$;

create or replace function private.can_access_storage_audio(p_path text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parts text[];
  v_owner_id text;
  v_job_id text;
begin
  v_parts := string_to_array(p_path, '/');
  if array_length(v_parts, 1) < 2 then
    return false;
  end if;
  v_owner_id := v_parts[1];
  v_job_id := v_parts[2];

  if v_owner_id = (select auth.uid())::text then
    return true;
  end if;

  if v_job_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return exists (
      select 1 from public.audio_jobs j
      where j.id = v_job_id::uuid
        and (
          j.owner_id = (select auth.uid())
          or (j.org_id is not null and private.is_org_member(j.org_id))
        )
    );
  end if;

  return false;
end;
$$;

-- 3. Storage Policies on storage.objects

-- -----------------------------------------------------------------------------
-- Bucket: uploads
-- -----------------------------------------------------------------------------
create policy "Users can upload under own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can read own uploads or org shared uploads"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'uploads'
    and private.can_access_storage_upload(name)
  );

-- Note: No client update or delete policy on uploads. Deletions occur via purge.

-- -----------------------------------------------------------------------------
-- Bucket: audio
-- -----------------------------------------------------------------------------
create policy "Users can stream audio tracks they have access to"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'audio'
    and private.can_access_storage_audio(name)
  );

-- Note: No client insert/update/delete policy on audio. Audio is written only by service role worker.

-- -----------------------------------------------------------------------------
-- Bucket: avatars
-- -----------------------------------------------------------------------------
create policy "Users can view avatars"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

