-- ==============================================================================
-- Migration 011: Document Upload Lifecycle & Stale Upload Cleanup
-- Project: Zukai Audio Learning App
-- Description: Adds 'uploading' to doc_status, complete_document_upload RPC with storage verification,
--              and private.cleanup_stale_uploads maintenance routine.
-- ==============================================================================

-- 1. Upgrade public.doc_status enum safely within a single transaction
do $$
begin
  -- Check if 'uploading' value already exists in doc_status
  if not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.doc_status'::regtype
      and enumlabel = 'uploading'
  ) then
    -- Recreate enum cleanly to bypass Postgres 55P04 uncommitted enum value limitation
    drop index if exists public.idx_documents_status_deleted;
    alter table public.documents alter column status drop default;
    alter table public.documents alter column status type text;
    drop type public.doc_status cascade;
    create type public.doc_status as enum ('uploading', 'uploaded', 'ready', 'failed', 'deleted');
    alter table public.documents alter column status type public.doc_status using status::public.doc_status;
    create index if not exists idx_documents_status_deleted on public.documents (status, deleted_at);
  end if;
end $$;

-- 2. Set default status of new document rows to 'uploading'
alter table public.documents alter column status set default 'uploading';

-- 3. Public RPC: complete_document_upload
-- Validates that the storage object exists in storage.objects and matches file_size_bytes
create or replace function public.complete_document_upload(p_document_id uuid)
returns public.documents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_doc public.documents;
  v_storage_size bigint;
  v_object_exists boolean;
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

  -- Only document owner can complete upload
  if v_doc.owner_id != v_user_id then
    raise exception 'ACCESS_DENIED: Only the document creator can complete the upload'
      using errcode = 'P0012';
  end if;

  if v_doc.status::text != 'uploading' then
    raise exception 'INVALID_STATUS: Document is not in uploading state (current: %)', v_doc.status
      using errcode = 'P0016';
  end if;

  -- Check existence of storage object in storage.objects
  select exists (
    select 1
    from storage.objects
    where bucket_id = 'uploads'
      and name = v_doc.storage_path
  ) into v_object_exists;

  if not v_object_exists then
    raise exception 'STORAGE_OBJECT_NOT_FOUND: File % does not exist in uploads bucket', v_doc.storage_path
      using errcode = 'P0017';
  end if;

  -- Verify size if available in metadata
  select coalesce((metadata->>'size')::bigint, 0) into v_storage_size
  from storage.objects
  where bucket_id = 'uploads'
    and name = v_doc.storage_path
  limit 1;

  if v_storage_size > 0 and abs(v_storage_size - v_doc.file_size_bytes) > 2048 then
    raise exception 'SIZE_MISMATCH: Uploaded object size (% bytes) does not match record (% bytes)',
      v_storage_size, v_doc.file_size_bytes
      using errcode = 'P0018';
  end if;

  -- Update document status to 'uploaded'
  update public.documents
  set status = 'uploaded',
      updated_at = now()
  where id = p_document_id
  returning * into v_doc;

  -- Audit log
  perform private.write_audit_log(
    v_user_id,
    v_doc.org_id,
    'document.uploaded',
    'document',
    p_document_id::text,
    jsonb_build_object(
      'title', v_doc.title,
      'storage_path', v_doc.storage_path,
      'file_size_bytes', v_doc.file_size_bytes
    )
  );

  return v_doc;
end;
$$;

-- 4. Maintenance Function: Cleanup stale uploads (Cron-ready)
create or replace function private.cleanup_stale_uploads(p_hours int default 4)
returns table (document_id uuid, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with stale_docs as (
    update public.documents
    set status = 'failed',
        error_code = 'UPLOAD_TIMEOUT',
        updated_at = now()
    where status::text = 'uploading'
      and created_at < (now() - (p_hours || ' hours')::interval)
    returning id, public.documents.storage_path
  )
  select id as document_id, stale_docs.storage_path from stale_docs;
end;
$$;
