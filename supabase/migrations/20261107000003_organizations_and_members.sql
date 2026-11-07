-- ==============================================================================
-- Migration 003: Organizations, Memberships & Invitations
-- Project: Zukai Audio Learning App
-- Description: Tenant boundary, multi-user membership with role controls & invite tracking
-- ==============================================================================

-- 1. Organizations Table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) >= 1 and length(name) <= 100),
  slug text not null unique check (length(slug) >= 2 and length(slug) <= 50 and slug ~ '^[a-z0-9-]+$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  plan_tier public.plan_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for organizations.updated_at
drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute function public.handle_updated_at();

-- Indexes on organizations
create index if not exists idx_organizations_created_by on public.organizations (created_by);
create index if not exists idx_organizations_plan_tier on public.organizations (plan_tier);

-- 2. Memberships Table
create table if not exists public.memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Indexes on memberships
create index if not exists idx_memberships_user_id on public.memberships (user_id);
create index if not exists idx_memberships_org_role on public.memberships (org_id, role);

-- 3. Constraint Trigger: Ensure organization always retains at least one owner
create or replace function private.ensure_last_owner_constraint()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_count int;
  v_org_id uuid;
begin
  -- If deletion is part of a cascading org delete (pg_trigger_depth > 1), allow it
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    else
      return new;
    end if;
  end if;

  if tg_op = 'DELETE' then
    v_org_id := old.org_id;
    if old.role = 'owner' then
      select count(*) into v_owner_count
      from public.memberships
      where org_id = v_org_id and role = 'owner' and user_id != old.user_id;

      if v_owner_count = 0 then
        raise exception 'CANNOT_REMOVE_LAST_OWNER: Organization must retain at least one owner'
          using errcode = 'P0001';
      end if;
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    v_org_id := old.org_id;
    if old.role = 'owner' and new.role != 'owner' then
      select count(*) into v_owner_count
      from public.memberships
      where org_id = v_org_id and role = 'owner' and user_id != old.user_id;

      if v_owner_count = 0 then
        raise exception 'CANNOT_DEMOTE_LAST_OWNER: Organization must retain at least one owner'
          using errcode = 'P0001';
      end if;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_ensure_last_owner on public.memberships;
create trigger trg_ensure_last_owner
  before delete or update on public.memberships
  for each row execute function private.ensure_last_owner_constraint();

-- 4. Invitations Table
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email ~* '^.+@.+\..+$'),
  role public.org_role not null default 'member',
  token_hash text not null check (length(token_hash) = 64),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Partial index: only one active pending invitation per (org_id, lower(email))
create unique index if not exists idx_invitations_unique_pending
  on public.invitations (org_id, lower(email))
  where (accepted_at is null);

create index if not exists idx_invitations_token_hash on public.invitations (token_hash);
create index if not exists idx_invitations_org_created on public.invitations (org_id, created_at desc);

