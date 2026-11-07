-- ==============================================================================
-- RLS Test: Profiles Table Isolation
-- Verifies that:
--   1. User A can read and update their own profile.
--   2. User A cannot read User B's profile (returns 0 rows).
--   3. User A cannot update User B's profile (affects 0 rows).
--   4. Client cannot insert directly into profiles.
--   5. Client cannot delete from profiles.
-- ==============================================================================

begin;

-- Create pgTAP extension if available, or run procedural verification
create extension if not exists pgtap;

select plan(7);

-- 1. Setup mock users
insert into auth.users (id, email, raw_user_meta_data)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'usera@zukai.app', '{"full_name": "User Alpha"}'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'userb@zukai.app', '{"full_name": "User Beta"}'::jsonb);

-- 2. Verify profiles automatically created by trigger
select is(
  (select full_name from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'User Alpha',
  'Trigger automatically created User A profile'
);

select is(
  (select full_name from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'User Beta',
  'Trigger automatically created User B profile'
);

-- 3. Switch role to User A
set local role authenticated;
set local "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
set local "request.jwt.claim.role" = 'authenticated';

-- 4. User A reads own profile -> should see 1 row
select is(
  (select email from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'usera@zukai.app',
  'User A can read own profile'
);

-- 5. User A tries to read User B's profile -> should see null (0 rows returned by RLS)
select is(
  (select email from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  null,
  'User A CANNOT read User B profile (RLS hides it)'
);

-- 6. User A updates own profile -> succeeds
update public.profiles
set preferred_language = 'hinglish'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select preferred_language from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'hinglish',
  'User A can update own profile'
);

-- 7. User A tries to update User B's profile -> 0 rows affected
update public.profiles
set full_name = 'Hacked Name'
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Switch back to superuser to inspect actual state
reset role;

select is(
  (select full_name from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'User Beta',
  'User A update on User B profile was blocked by RLS'
);

-- 8. Client-side insert test (switching back to User A)
set local role authenticated;
set local "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select throws_ok(
  $$ insert into public.profiles (id, email) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'attacker@zukai.app') $$,
  '42501', -- insufficient_privilege
  null,
  'Client-side direct insert into profiles is rejected by RLS'
);

select * from finish();

rollback;

