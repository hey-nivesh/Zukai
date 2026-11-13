-- ==============================================================================
-- Migration 011: Document Upload Lifecycle & Stale Upload Cleanup
-- Project: Zukai Audio Learning App
-- Description: Adds 'uploading' to doc_status, complete_document_upload RPC with storage verification,
--              and private.cleanup_stale_uploads maintenance routine.
-- ==============================================================================

-- 1. Upgrade public.doc_status enum safely within a single transaction
DO $$
BEGIN
  -- Check if 'uploading' value already exists in doc_status
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.doc_status'::regtype
      AND enumlabel = 'uploading'
  ) THEN
    -- Recreate enum cleanly to bypass Postgres 55P04 uncommitted enum value limitation
    DROP INDEX IF EXISTS public.idx_documents_status_deleted;
    ALTER TABLE public.documents ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.documents ALTER COLUMN status TYPE text;
    DROP TYPE public.doc_status CASCADE;
    CREATE TYPE public.doc_status AS ENUM ('uploading', 'uploaded', 'ready', 'failed', 'deleted');
    ALTER TABLE public.documents ALTER COLUMN status TYPE public.doc_status USING status::public.doc_status;
    CREATE INDEX IF NOT EXISTS idx_documents_status_deleted ON public.documents (status, deleted_at);
  END IF;
END $$;

-- 2. Set default status of new document rows to 'uploading'
ALTER TABLE public.documents ALTER COLUMN status SET DEFAULT 'uploading';

-- 3. Public RPC: complete_document_upload
-- Validates that the storage object exists in storage.objects and matches file_size_bytes
CREATE OR REPLACE FUNCTION public.complete_document_upload(p_document_id uuid)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_doc public.documents;
  v_storage_size bigint;
  v_object_exists boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required' USING errcode = 'P0006';
  END IF;

  SELECT * INTO v_doc
  FROM public.documents
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DOCUMENT_NOT_FOUND: Document does not exist' USING errcode = 'P0009';
  END IF;

  -- Only document owner can complete upload
  IF v_doc.owner_id != v_user_id THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Only the document creator can complete the upload'
      USING errcode = 'P0012';
  END IF;

  IF v_doc.status::text != 'uploading' THEN
    RAISE EXCEPTION 'INVALID_STATUS: Document is not in uploading state (current: %)', v_doc.status
      USING errcode = 'P0016';
  END IF;

  -- Check existence of storage object in storage.objects
  SELECT EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'uploads'
      AND name = v_doc.storage_path
  ) INTO v_object_exists;

  IF NOT v_object_exists THEN
    RAISE EXCEPTION 'STORAGE_OBJECT_NOT_FOUND: File % does not exist in uploads bucket', v_doc.storage_path
      USING errcode = 'P0017';
  END IF;

  -- Verify size if available in metadata
  SELECT coalesce((metadata->>'size')::bigint, 0) INTO v_storage_size
  FROM storage.objects
  WHERE bucket_id = 'uploads'
    AND name = v_doc.storage_path
  LIMIT 1;

  IF v_storage_size > 0 AND abs(v_storage_size - v_doc.file_size_bytes) > 2048 THEN
    RAISE EXCEPTION 'SIZE_MISMATCH: Uploaded object size (% bytes) does not match record (% bytes)',
      v_storage_size, v_doc.file_size_bytes
      USING errcode = 'P0018';
  END IF;

  -- Update document status to 'uploaded'
  UPDATE public.documents
  SET status = 'uploaded',
      updated_at = now()
  WHERE id = p_document_id
  RETURNING * INTO v_doc;

  -- Audit log
  PERFORM private.write_audit_log(
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

  RETURN v_doc;
END;
$$;

-- 4. Maintenance Function: Cleanup stale uploads (Cron-ready)
CREATE OR REPLACE FUNCTION private.cleanup_stale_uploads(p_hours int DEFAULT 4)
RETURNS TABLE (document_id uuid, storage_path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN query
  WITH stale_docs AS (
    UPDATE public.documents
    SET status = 'failed',
        error_code = 'UPLOAD_TIMEOUT',
        updated_at = now()
    WHERE status::text = 'uploading'
      AND created_at < (now() - (p_hours || ' hours')::interval)
    RETURNING id, public.documents.storage_path
  )
  SELECT id AS document_id, stale_docs.storage_path FROM stale_docs;
END;
$$;