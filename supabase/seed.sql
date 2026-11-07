-- ==============================================================================
-- ZUKAI DATABASE SEED DATA (DEVELOPMENT ONLY)
-- Warning: DO NOT EXECUTE IN PRODUCTION! THIS CONTAINS SYNTHETIC TEST FIXTURES.
-- ==============================================================================

-- 1. Test Users (A and B)
-- User A: Alex Rivera (Pro Subscriber)
-- User B: Priya Sharma (Team Member)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'user.a@zukai.app',
    '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alex Rivera","preferred_language":"english"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'user.b@zukai.app',
    '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Priya Sharma","preferred_language":"hinglish"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
on conflict (id) do nothing;

-- Ensure profiles exist
insert into public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  preferred_language,
  onboarding_completed
) values
  ('00000000-0000-0000-0000-000000000001', 'user.a@zukai.app', 'Alex Rivera', '', 'english', true),
  ('00000000-0000-0000-0000-000000000002', 'user.b@zukai.app', 'Priya Sharma', '', 'hinglish', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  preferred_language = excluded.preferred_language,
  onboarding_completed = excluded.onboarding_completed;

-- 2. Test Organization: Acme Innovations
insert into public.organizations (
  id,
  name,
  slug,
  created_by,
  plan_tier
) values
  (
    '10000000-0000-0000-0000-000000000001',
    'Acme Innovations',
    'acme-innovations',
    '00000000-0000-0000-0000-000000000001',
    'team'
  )
on conflict (id) do nothing;

-- 3. Memberships (User A: Owner, User B: Member)
insert into public.memberships (org_id, user_id, role)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member')
on conflict (org_id, user_id) do nothing;

-- 4. Subscriptions
insert into public.subscriptions (
  id,
  user_id,
  org_id,
  tier,
  status,
  provider,
  provider_customer_id,
  current_period_end
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'pro',
    'active',
    'revenuecat',
    'rc_user_a_123',
    now() + interval '25 days'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'team',
    'active',
    'revenuecat',
    'rc_org_acme_456',
    now() + interval '30 days'
  )
on conflict (id) do nothing;

-- 5. Test Documents
-- Doc 1: Ready document with generated audio (User A, Personal)
insert into public.documents (
  id,
  owner_id,
  org_id,
  title,
  original_filename,
  mime_type,
  file_size_bytes,
  storage_path,
  page_count,
  word_count,
  source_language,
  status
) values
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'Quarterly Strategy & Market Analysis',
    'Q3_Strategy_Analysis.pdf',
    'application/pdf',
    2457600,
    'uploads/00000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/original.pdf',
    18,
    4850,
    'en',
    'ready'
  ),
  -- Doc 2: Freshly uploaded document pending conversion (User A, Personal)
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    null,
    'Cloud Security Architecture Whitepaper',
    'Cloud_Security_2026.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    5120000,
    'uploads/00000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000002/original.docx',
    34,
    9200,
    'en',
    'uploaded'
  ),
  -- Doc 3: Team shared document (Acme Org)
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Engineering Team Onboarding Guide',
    'Engineering_Handbook.pdf',
    'application/pdf',
    1843200,
    'uploads/00000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000003/original.pdf',
    12,
    3100,
    'en',
    'ready'
  ),
  -- Doc 4: Failed document (Encrypted / Corrupt)
  (
    '30000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    null,
    'Protected Financial Ledger 2025',
    'Ledger_Encrypted.pdf',
    'application/pdf',
    980000,
    'uploads/00000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000004/original.pdf',
    5,
    0,
    'en',
    'failed'
  )
on conflict (id) do nothing;

-- 6. Audio Jobs
-- Job 1: Completed Job for Doc 1
insert into public.audio_jobs (
  id,
  document_id,
  owner_id,
  org_id,
  language,
  depth,
  voice,
  status,
  progress,
  current_step,
  attempt_count,
  input_tokens,
  output_tokens,
  tts_characters,
  cost_micros,
  started_at,
  finished_at
) values
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'english',
    'standard',
    'alloy',
    'ready',
    100,
    'Completed successfully',
    1,
    6400,
    1850,
    9200,
    28500,
    now() - interval '2 hours',
    now() - interval '1 hour 58 minutes'
  ),
  -- Job 2: Failed Job
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    null,
    'english',
    'quick',
    'alloy',
    'failed',
    10,
    'Failed permanently after 3 attempts',
    3,
    0,
    0,
    0,
    0,
    now() - interval '1 day',
    now() - interval '1 day'
  )
on conflict (id) do nothing;

-- 7. Audio Tracks (for Job 1)
insert into public.audio_tracks (
  id,
  job_id,
  document_id,
  owner_id,
  org_id,
  storage_path,
  duration_seconds,
  format,
  bitrate_kbps,
  file_size_bytes
) values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'audio/00000000-0000-0000-0000-000000000001/40000000-0000-0000-0000-000000000001/final.m4a',
    675, -- 11m 15s
    'm4a',
    128,
    10800000
  )
on conflict (id) do nothing;

-- 8. Chapters (for Track 1)
insert into public.chapters (
  id,
  track_id,
  position,
  title,
  start_seconds,
  end_seconds,
  summary
) values
  (
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    0,
    'Executive Summary & Market Context',
    0.0,
    180.0,
    'High level macroeconomic trends and customer acquisition growth.'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001',
    1,
    'Product Milestones & Core Drivers',
    180.0,
    420.0,
    'Deep dive into the 3 flagship feature launches and customer retention numbers.'
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000001',
    2,
    'Strategic Outlook & Next Quarter Roadmap',
    420.0,
    675.0,
    'Key deliverables for enterprise sales expansion and international compliance.'
  )
on conflict (id) do nothing;

-- 9. Transcripts (for Track 1)
insert into public.transcripts (
  id,
  track_id,
  language,
  segments,
  full_text
) values
  (
    '70000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'english',
    '[
      {"start": 0.0, "end": 4.5, "text": "Welcome to Zukai. Here is your strategic breakdown of the Q3 Market Analysis."},
      {"start": 4.5, "end": 9.2, "text": "Let us start with the big picture: customer acquisition accelerated by 34% this quarter."},
      {"start": 9.2, "end": 15.0, "text": "Enterprise pipeline expanded across North America and APAC regions with high conversion rates."}
    ]'::jsonb,
    'Welcome to Zukai. Here is your strategic breakdown of the Q3 Market Analysis. Let us start with the big picture: customer acquisition accelerated by 34% this quarter. Enterprise pipeline expanded across North America and APAC regions with high conversion rates.'
  )
on conflict (id) do nothing;

-- 10. Playback Progress
insert into public.playback_progress (
  user_id,
  track_id,
  position_seconds,
  speed,
  completed
) values
  ('00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 245.5, 1.25, false)
on conflict (user_id, track_id) do update set
  position_seconds = excluded.position_seconds,
  speed = excluded.speed;

-- 11. Usage Events
insert into public.usage_events (
  owner_id,
  org_id,
  job_id,
  event_type,
  quantity
) values
  ('00000000-0000-0000-0000-000000000001', null, '40000000-0000-0000-0000-000000000001', 'audio_minutes', 11.25)
on conflict do nothing;

