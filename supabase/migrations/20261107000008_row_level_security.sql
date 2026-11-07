-- ==============================================================================
-- Migration 008: Row Level Security (RLS) & Explicit Permissions
-- Project: Zukai Audio Learning App
-- Description: Enables RLS on EVERY public table with strict least-privilege policies
-- ==============================================================================

-- 1. Enable RLS on all public tables
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.documents enable row level security;
alter table public.audio_jobs enable row level security;
alter table public.audio_tracks enable row level security;
alter table public.chapters enable row level security;
alter table public.transcripts enable row level security;
alter table public.playback_progress enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.audit_logs enable row level security;

-- 2. Revoke and Grant Permissions (Explicit Least-Privilege)

-- Revoke all permissions from anon
revoke all on public.organizations from anon;
revoke all on public.memberships from anon;
revoke all on public.invitations from anon;
revoke all on public.documents from anon;
revoke all on public.audio_jobs from anon;
revoke all on public.audio_tracks from anon;
revoke all on public.chapters from anon;
revoke all on public.transcripts from anon;
revoke all on public.playback_progress from anon;
revoke all on public.plans from anon;
revoke all on public.subscriptions from anon;
revoke all on public.usage_events from anon;
revoke all on public.audit_logs from anon;

-- Revoke all permissions from authenticated, then selectively grant
revoke all on public.organizations from authenticated;
revoke all on public.memberships from authenticated;
revoke all on public.invitations from authenticated;
revoke all on public.documents from authenticated;
revoke all on public.audio_jobs from authenticated;
revoke all on public.audio_tracks from authenticated;
revoke all on public.chapters from authenticated;
revoke all on public.transcripts from authenticated;
revoke all on public.playback_progress from authenticated;
revoke all on public.plans from authenticated;
revoke all on public.subscriptions from authenticated;
revoke all on public.usage_events from authenticated;
revoke all on public.audit_logs from authenticated;

-- Read grants for authenticated users
grant select on public.organizations to authenticated;
grant select on public.memberships to authenticated;
grant select on public.invitations to authenticated;
grant select on public.documents to authenticated;
grant select on public.audio_jobs to authenticated;
grant select on public.audio_tracks to authenticated;
grant select on public.chapters to authenticated;
grant select on public.transcripts to authenticated;
grant select on public.playback_progress to authenticated;
grant select on public.plans to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.usage_events to authenticated;
grant select on public.audit_logs to authenticated;

-- Write grants only on allowed tables
grant insert, update, delete on public.organizations to authenticated;
grant insert, update, delete on public.memberships to authenticated;
grant insert, update, delete on public.invitations to authenticated;
grant insert, update on public.documents to authenticated;
grant insert, update, delete on public.playback_progress to authenticated;

-- Note: audio_jobs, audio_tracks, chapters, transcripts, plans, subscriptions,
-- usage_events, and audit_logs have NO direct client insert/update/delete grants!

-- 3. RLS Policies

-- -----------------------------------------------------------------------------
-- Organizations Policies
-- -----------------------------------------------------------------------------
create policy "Members can view their organizations"
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.org_id = organizations.id
        and m.user_id = (select auth.uid())
    )
  );

create policy "Users can create organizations"
  on public.organizations
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "Admins and Owners can update their organization"
  on public.organizations
  for update
  to authenticated
  using (private.can_manage_org(id))
  with check (private.can_manage_org(id));

create policy "Owners can delete their organization"
  on public.organizations
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.org_id = organizations.id
        and m.user_id = (select auth.uid())
        and m.role = 'owner'
    )
  );

-- -----------------------------------------------------------------------------
-- Memberships Policies
-- -----------------------------------------------------------------------------
create policy "Members can view co-members in their organization"
  on public.memberships
  for select
  to authenticated
  using (private.is_org_member(org_id));

create policy "Admins and Owners can add members"
  on public.memberships
  for insert
  to authenticated
  with check (private.can_manage_org(org_id));

create policy "Owners can update member roles"
  on public.memberships
  for update
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.org_id = memberships.org_id
        and m.user_id = (select auth.uid())
        and m.role = 'owner'
    )
  );

create policy "Admins and Owners can remove members or users can leave"
  on public.memberships
  for delete
  to authenticated
  using (
    private.can_manage_org(org_id) or user_id = (select auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Invitations Policies
-- -----------------------------------------------------------------------------
create policy "Admins and Owners can view invitations"
  on public.invitations
  for select
  to authenticated
  using (private.can_manage_org(org_id));

create policy "Admins and Owners can create invitations"
  on public.invitations
  for insert
  to authenticated
  with check (private.can_manage_org(org_id));

create policy "Admins and Owners can update invitations"
  on public.invitations
  for update
  to authenticated
  using (private.can_manage_org(org_id));

create policy "Admins and Owners can delete invitations"
  on public.invitations
  for delete
  to authenticated
  using (private.can_manage_org(org_id));

-- -----------------------------------------------------------------------------
-- Documents Policies
-- -----------------------------------------------------------------------------
create policy "Users can view own or org documents"
  on public.documents
  for select
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      or (org_id is not null and private.is_org_member(org_id))
    )
    and deleted_at is null
  );

create policy "Users can insert documents into personal or member org"
  on public.documents
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (org_id is null or private.is_org_member(org_id))
  );

create policy "Owner or org admin can update document metadata"
  on public.documents
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or (org_id is not null and private.can_manage_org(org_id))
  )
  with check (
    owner_id = (select auth.uid())
    or (org_id is not null and private.can_manage_org(org_id))
  );

-- Note: NO DELETE policy for documents! Soft-delete is performed exclusively via soft_delete_document() RPC.

-- -----------------------------------------------------------------------------
-- Audio Jobs Policies
-- -----------------------------------------------------------------------------
create policy "Users can view own or org audio jobs"
  on public.audio_jobs
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or (org_id is not null and private.is_org_member(org_id))
  );

-- Note: NO INSERT/UPDATE/DELETE policies for clients.
-- Jobs are inserted via create_audio_job() RPC, updated by worker or cancel_audio_job() RPC.

-- -----------------------------------------------------------------------------
-- Audio Tracks Policies
-- -----------------------------------------------------------------------------
create policy "Users can view own or org audio tracks"
  on public.audio_tracks
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or (org_id is not null and private.is_org_member(org_id))
  );

-- -----------------------------------------------------------------------------
-- Chapters Policies
-- -----------------------------------------------------------------------------
create policy "Users can view chapters of accessible tracks"
  on public.chapters
  for select
  to authenticated
  using (
    exists (
      select 1 from public.audio_tracks t
      where t.id = chapters.track_id
        and (
          t.owner_id = (select auth.uid())
          or (t.org_id is not null and private.is_org_member(t.org_id))
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Transcripts Policies
-- -----------------------------------------------------------------------------
create policy "Users can view transcripts of accessible tracks"
  on public.transcripts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.audio_tracks t
      where t.id = transcripts.track_id
        and (
          t.owner_id = (select auth.uid())
          or (t.org_id is not null and private.is_org_member(t.org_id))
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Playback Progress Policies
-- -----------------------------------------------------------------------------
create policy "Users can view own playback progress"
  on public.playback_progress
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own playback progress"
  on public.playback_progress
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own playback progress"
  on public.playback_progress
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own playback progress"
  on public.playback_progress
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Plans Policies (Read-only catalog for clients)
-- -----------------------------------------------------------------------------
create policy "Authenticated users can view plans"
  on public.plans
  for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Subscriptions Policies
-- -----------------------------------------------------------------------------
create policy "Users can view own or managed org subscriptions"
  on public.subscriptions
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (org_id is not null and private.can_manage_org(org_id))
  );

-- -----------------------------------------------------------------------------
-- Usage Events Policies
-- -----------------------------------------------------------------------------
create policy "Users can view own or managed org usage events"
  on public.usage_events
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or (org_id is not null and private.can_manage_org(org_id))
  );

-- -----------------------------------------------------------------------------
-- Audit Logs Policies
-- -----------------------------------------------------------------------------
create policy "Users can view relevant audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (
    (org_id is not null and private.can_manage_org(org_id))
    or (org_id is null and actor_id = (select auth.uid()))
  );

