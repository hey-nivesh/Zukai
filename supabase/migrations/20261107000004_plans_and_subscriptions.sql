-- ==============================================================================
-- Migration 004: Plans & Subscriptions
-- Project: Zukai Audio Learning App
-- Description: Tier limit specifications seeded from LIMITS_AND_RULES.md and subscription state
-- ==============================================================================

-- 1. Plans Table (Read-only catalog for clients)
create table if not exists public.plans (
  tier public.plan_tier primary key,
  monthly_audio_minutes int not null check (monthly_audio_minutes >= 0),
  max_file_size_mb int not null check (max_file_size_mb > 0),
  max_pages int not null check (max_pages > 0),
  max_documents int not null check (max_documents >= 0),
  max_concurrent_jobs int not null check (max_concurrent_jobs > 0),
  offline_downloads boolean not null default false,
  team_features boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for plans.updated_at
drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at
  before update on public.plans
  for each row execute function public.handle_updated_at();

-- Seed Plans catalog from LIMITS_AND_RULES.md
insert into public.plans (
  tier,
  monthly_audio_minutes,
  max_file_size_mb,
  max_pages,
  max_documents,
  max_concurrent_jobs,
  offline_downloads,
  team_features
) values
  ('free', 45, 10, 20, 5, 1, false, false),
  ('pro', 450, 50, 150, 100, 3, true, false),
  ('team', 1500, 100, 300, 500, 10, true, true),
  ('enterprise', 10000, 250, 1000, 10000, 50, true, true)
on conflict (tier) do update set
  monthly_audio_minutes = excluded.monthly_audio_minutes,
  max_file_size_mb = excluded.max_file_size_mb,
  max_pages = excluded.max_pages,
  max_documents = excluded.max_documents,
  max_concurrent_jobs = excluded.max_concurrent_jobs,
  offline_downloads = excluded.offline_downloads,
  team_features = excluded.team_features,
  updated_at = now();

-- 2. Subscriptions Table (Managed by webhook / service-role)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  tier public.plan_tier not null default 'free',
  status text not null default 'active' check (status in ('active', 'trial', 'grace', 'expired', 'canceled')),
  provider text not null default 'revenuecat',
  provider_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for subscriptions.updated_at
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Indexes on subscriptions
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);
create index if not exists idx_subscriptions_org_id on public.subscriptions (org_id);
create index if not exists idx_subscriptions_status_period on public.subscriptions (status, current_period_end);

