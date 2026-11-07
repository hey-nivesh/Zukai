-- ==============================================================================
-- Zukai pgTAP Test Suite: Phase 5 Document Upload Lifecycle
-- File: /supabase/tests/phase5_upload_test.sql
-- ==============================================================================

begin;
select plan(7);

-- 1. Check doc_status enum contains 'uploading'
select ok(
  exists (
    select 1
    from pg_enum
    where enumlabel = 'uploading'
      and enumtypid = 'public.doc_status'::regtype
  ),
  'doc_status enum contains uploading value'
);

-- 2. Setup test fixture
insert into auth.users (id, email, raw_user_meta_data, role, aud)
values ('11110000-0000-0000-0000-000000000001', 'uploader.a@test.com', '{"full_name":"Uploader A"}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into auth.users (id, email, raw_user_meta_data, role, aud)
values ('22220000-0000-0000-0000-000000000002', 'uploader.b@test.com', '{"full_name":"Uploader B"}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- User A creates document in 'uploading' state
insert into public.documents (
  id, owner_id, title, original_filename, mime_type, file_size_bytes, storage_path, status
) values (
  '99990000-0000-0000-0000-000000000001',
  '11110000-0000-0000-0000-000000000001',
  'Test Upload Doc',
  'test.pdf',
  'application/pdf',
  500000,
  '11110000-0000-0000-0000-000000000001/99990000-0000-0000-0000-000000000001/original.pdf',
  'uploading'
) on conflict (id) do nothing;

-- 3. Anonymous user cannot complete upload
set local role anon;
select throws_ok(
  $$ select public.complete_document_upload('99990000-0000-0000-0000-000000000001') $$,
  'UNAUTHORIZED: Authentication required',
  'Anonymous users cannot call complete_document_upload'
);

-- 4. Cross-user violation: User B cannot complete User A upload
set local role authenticated;
set local request.jwt.claims to '{"sub": "22220000-0000-0000-0000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.complete_document_upload('99990000-0000-0000-0000-000000000001') $$,
  'ACCESS_DENIED: Only the document creator can complete the upload',
  'User B cannot complete User A upload'
);

-- 5. Missing storage object check: User A calls complete_document_upload before object exists
set local role authenticated;
set local request.jwt.claims to '{"sub": "11110000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.complete_document_upload('99990000-0000-0000-0000-000000000001') $$,
  'STORAGE_OBJECT_NOT_FOUND: File 11110000-0000-0000-0000-000000000001/99990000-0000-0000-0000-000000000001/original.pdf does not exist in uploads bucket',
  'complete_document_upload fails when object is missing in storage'
);

-- 6. Successful completion when object exists
reset role;
insert into storage.objects (
  id, bucket_id, name, owner, metadata
) values (
  gen_random_uuid(),
  'uploads',
  '11110000-0000-0000-0000-000000000001/99990000-0000-0000-0000-000000000001/original.pdf',
  '11110000-0000-0000-0000-000000000001',
  '{"size": 500000}'::jsonb
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11110000-0000-0000-0000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ select public.complete_document_upload('99990000-0000-0000-0000-000000000001') $$,
  'complete_document_upload succeeds when storage object exists and size matches'
);

-- 7. Cannot complete document twice
select throws_ok(
  $$ select public.complete_document_upload('99990000-0000-0000-0000-000000000001') $$,
  'INVALID_STATUS: Document is not in uploading state (current: uploaded)',
  'Cannot complete document upload twice'
);

select * from finish();
rollback;

