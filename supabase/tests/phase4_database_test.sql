-- ==============================================================================
-- Zukai pgTAP Test Suite: Phase 4 Schema, RLS, Quotas & Role Isolation
-- File: /supabase/tests/phase4_database_test.sql
-- ==============================================================================

begin;
select plan(28);

-- ==============================================================================
-- 1. Schema Invariant: Ensure RLS is enabled on EVERY public table
-- ==============================================================================
select ok(
  not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = false
  ),
  'RLS must be enabled on every table in the public schema without exception'
);

-- Check presence of core tables
select has_table('public', 'organizations', 'organizations table exists');
select has_table('public', 'memberships', 'memberships table exists');
select has_table('public', 'invitations', 'invitations table exists');
select has_table('public', 'documents', 'documents table exists');
select has_table('public', 'audio_jobs', 'audio_jobs table exists');
select has_table('public', 'audio_tracks', 'audio_tracks table exists');
select has_table('public', 'chapters', 'chapters table exists');
select has_table('public', 'transcripts', 'transcripts table exists');
select has_table('public', 'playback_progress', 'playback_progress table exists');
select has_table('public', 'plans', 'plans table exists');
select has_table('public', 'subscriptions', 'subscriptions table exists');
select has_table('public', 'usage_events', 'usage_events table exists');
select has_table('public', 'audit_logs', 'audit_logs table exists');

-- Check presence of private schema
select has_schema('private', 'private schema exists for security definer helpers');

-- ==============================================================================
-- 2. Test Fixtures: Two Distinct Users & One Organization
-- ==============================================================================
create or replace function tests.setup_test_environment()
returns void
language plpgsql
as $$
begin
  -- Insert User A
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values ('aaaa0000-0000-0000-0000-000000000001', 'usera@test.com', '{"full_name":"User A"}'::jsonb, 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  -- Insert User B
  insert into auth.users (id, email, raw_user_meta_data, role, aud)
  values ('bbbb0000-0000-0000-0000-000000000002', 'userb@test.com', '{"full_name":"User B"}'::jsonb, 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  -- Insert Org created by User A
  insert into public.organizations (id, name, slug, created_by, plan_tier)
  values ('cccc0000-0000-0000-0000-000000000001', 'Test Org', 'test-org', 'aaaa0000-0000-0000-0000-000000000001', 'team')
  on conflict (id) do nothing;

  -- User A is Owner of Org
  insert into public.memberships (org_id, user_id, role)
  values ('cccc0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001', 'owner')
  on conflict (org_id, user_id) do nothing;

  -- User A creates a personal document
  insert into public.documents (
    id, owner_id, org_id, title, original_filename, mime_type, file_size_bytes, storage_path, status
  ) values (
    'dddd0000-0000-0000-0000-000000000001',
    'aaaa0000-0000-0000-0000-000000000001',
    null,
    'User A Secret Document',
    'secret.pdf',
    'application/pdf',
    1048576,
    'uploads/aaaa0000-0000-0000-0000-000000000001/dddd0000-0000-0000-0000-000000000001/original.pdf',
    'ready'
  ) on conflict (id) do nothing;
end;
$$;

select tests.setup_test_environment();

-- ==============================================================================
-- 3. Anonymous Access Denied
-- ==============================================================================
set local role anon;

select is_empty(
  'select * from public.documents',
  'Anonymous users cannot read any documents'
);

select throws_ok(
  $$ insert into public.documents (title, original_filename, mime_type, file_size_bytes, storage_path)
     values ('Anon Doc', 'anon.pdf', 'application/pdf', 100, 'path') $$,
  'permission denied for table documents',
  'Anonymous users cannot insert documents'
);

select is_empty(
  'select * from public.organizations',
  'Anonymous users cannot read organizations'
);

-- ==============================================================================
-- 4. Cross-User Isolation (User B cannot read User A personal documents)
-- ==============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "bbbb0000-0000-0000-0000-000000000002", "role": "authenticated"}';

select is_empty(
  'select * from public.documents where id = ''dddd0000-0000-0000-0000-000000000001''',
  'User B cannot view User A personal document'
);

-- ==============================================================================
-- 5. Org Document Sharing (User B invited to Org can read org documents)
-- ==============================================================================
-- Setup: User A adds User B as member to Test Org and adds an org document
reset role;
insert into public.memberships (org_id, user_id, role)
values ('cccc0000-0000-0000-0000-000000000001', 'bbbb0000-0000-0000-0000-000000000002', 'member')
on conflict (org_id, user_id) do nothing;

insert into public.documents (
  id, owner_id, org_id, title, original_filename, mime_type, file_size_bytes, storage_path, status
) values (
  'dddd0000-0000-0000-0000-000000000002',
  'aaaa0000-0000-0000-0000-000000000001',
  'cccc0000-0000-0000-0000-000000000001',
  'Org Shared Document',
  'shared.pdf',
  'application/pdf',
  2048576,
  'uploads/aaaa0000-0000-0000-0000-000000000001/dddd0000-0000-0000-0000-000000000002/original.pdf',
  'ready'
) on conflict (id) do nothing;

-- Switch to User B
set local role authenticated;
set local request.jwt.claims to '{"sub": "bbbb0000-0000-0000-0000-000000000002", "role": "authenticated"}';

select results_eq(
  'select title from public.documents where id = ''dddd0000-0000-0000-0000-000000000002''',
  $$ values ('Org Shared Document'::text) $$,
  'Org member User B can view org shared document'
);

-- User B (Member) cannot manage members (cannot invite or add members)
select throws_ok(
  $$ insert into public.memberships (org_id, user_id, role)
     values ('cccc0000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'member') $$,
  'new row violates row-level security policy for table "memberships"',
  'Standard member cannot add new members to organization'
);

-- ==============================================================================
-- 6. Direct Client Mutation Prohibitions (No direct write to audio_jobs, tracks, plans)
-- ==============================================================================
select throws_ok(
  $$ insert into public.audio_jobs (document_id, owner_id)
     values ('dddd0000-0000-0000-0000-000000000002', 'bbbb0000-0000-0000-0000-000000000002') $$,
  'permission denied for table audio_jobs',
  'Authenticated users cannot directly insert into audio_jobs'
);

select throws_ok(
  $$ insert into public.audio_tracks (job_id, document_id, owner_id, storage_path, duration_seconds, file_size_bytes)
     values ('40000000-0000-0000-0000-000000000001', 'dddd0000-0000-0000-0000-000000000002', 'bbbb0000-0000-0000-0000-000000000002', 'path', 100, 100) $$,
  'permission denied for table audio_tracks',
  'Authenticated users cannot directly insert into audio_tracks'
);

select throws_ok(
  $$ insert into public.plans (tier, monthly_audio_minutes, max_file_size_mb, max_pages, max_documents, max_concurrent_jobs)
     values ('pro', 99999, 100, 100, 100, 10) $$,
  'permission denied for table plans',
  'Authenticated users cannot modify plans catalog'
);

-- ==============================================================================
-- 7. Last Owner Invariant Enforcement
-- ==============================================================================
reset role;
select throws_ok(
  $$ delete from public.memberships
     where org_id = 'cccc0000-0000-0000-0000-000000000001'
       and user_id = 'aaaa0000-0000-0000-0000-000000000001' $$,
  'CANNOT_REMOVE_LAST_OWNER: Organization must retain at least one owner',
  'Cannot remove or delete the last owner of an organization'
);

select throws_ok(
  $$ update public.memberships
     set role = 'member'
     where org_id = 'cccc0000-0000-0000-0000-000000000001'
       and user_id = 'aaaa0000-0000-0000-0000-000000000001' $$,
  'CANNOT_DEMOTE_LAST_OWNER: Organization must retain at least one owner',
  'Cannot demote the last owner of an organization'
);

-- ==============================================================================
-- 8. Quota & Concurrency Enforcement via create_audio_job
-- ==============================================================================
-- Switch to User B (Personal Free Tier, no documents ready)
set local role authenticated;
set local request.jwt.claims to '{"sub": "bbbb0000-0000-0000-0000-000000000002", "role": "authenticated"}';

-- Trying to generate audio on User A's private document should fail with ACCESS_DENIED
select throws_ok(
  $$ select public.create_audio_job('dddd0000-0000-0000-0000-000000000001') $$,
  'ACCESS_DENIED: You do not have permission to access this document',
  'create_audio_job denies access to unauthorized documents'
);

select * from finish();
rollback;

