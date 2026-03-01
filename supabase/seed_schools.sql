-- ============================================================
--  SEED: 10 Schools + School Admin Users  (password: 123456789)
--
--  HOW IT WORKS:
--  1. Insert 10 schools with known UUIDs (approved)
--  2. Insert auth.users for each admin — bcrypt hash is computed
--     live via pgcrypto's crypt() so no plain-text password is stored
--  3. The on_auth_user_created trigger auto-creates the profile row
--     using the raw_user_meta_data we supply (role, status, school_id)
--  4. A final UPDATE syncs school.admin_email for the approval trigger
--
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 0. Enable pgcrypto (already on in Supabase, just in case) ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Pre-define school UUIDs ───────────────────────────────────
DO $$
DECLARE
  -- School IDs
  s1  UUID := 'aaaaaaaa-0001-0001-0001-000000000001';
  s2  UUID := 'aaaaaaaa-0002-0002-0002-000000000002';
  s3  UUID := 'aaaaaaaa-0003-0003-0003-000000000003';
  s4  UUID := 'aaaaaaaa-0004-0004-0004-000000000004';
  s5  UUID := 'aaaaaaaa-0005-0005-0005-000000000005';
  s6  UUID := 'aaaaaaaa-0006-0006-0006-000000000006';
  s7  UUID := 'aaaaaaaa-0007-0007-0007-000000000007';
  s8  UUID := 'aaaaaaaa-0008-0008-0008-000000000008';
  s9  UUID := 'aaaaaaaa-0009-0009-0009-000000000009';
  s10 UUID := 'aaaaaaaa-0010-0010-0010-000000000010';

  -- User IDs
  u1  UUID := 'bbbbbbbb-0001-0001-0001-000000000001';
  u2  UUID := 'bbbbbbbb-0002-0002-0002-000000000002';
  u3  UUID := 'bbbbbbbb-0003-0003-0003-000000000003';
  u4  UUID := 'bbbbbbbb-0004-0004-0004-000000000004';
  u5  UUID := 'bbbbbbbb-0005-0005-0005-000000000005';
  u6  UUID := 'bbbbbbbb-0006-0006-0006-000000000006';
  u7  UUID := 'bbbbbbbb-0007-0007-0007-000000000007';
  u8  UUID := 'bbbbbbbb-0008-0008-0008-000000000008';
  u9  UUID := 'bbbbbbbb-0009-0009-0009-000000000009';
  u10 UUID := 'bbbbbbbb-0010-0010-0010-000000000010';

  pwd_hash TEXT;
BEGIN

  -- ── 2. Compute bcrypt hash for '123456789' ─────────────────────
  pwd_hash := crypt('123456789', gen_salt('bf', 10));

  -- ── 3. Insert Schools ──────────────────────────────────────────
  INSERT INTO public.schools (id, name, address, status, admin_email) VALUES
    (s1,  'Harmony Academy of Music',        '14 Raaga Street, Mumbai, Maharashtra',         'approved', 'admin.harmony@school.edu'),
    (s2,  'Melody Heights School',           '7 Swara Nagar, Delhi',                         'approved', 'admin.melody@school.edu'),
    (s3,  'Rhythm International School',     '23 Beat Avenue, Bengaluru, Karnataka',          'approved', 'admin.rhythm@school.edu'),
    (s4,  'Sargam School of Arts',           '5 Taal Road, Chennai, Tamil Nadu',             'approved', 'admin.sargam@school.edu'),
    (s5,  'Suron Ki Duniya Academy',         '88 Shruti Colony, Hyderabad, Telangana',       'approved', 'admin.suron@school.edu'),
    (s6,  'Nada Brahma Music School',        '3 Raga Lane, Pune, Maharashtra',               'approved', 'admin.nada@school.edu'),
    (s7,  'Veenavadini School of Fine Arts', '11 Veena Vihar, Kolkata, West Bengal',         'approved', 'admin.veena@school.edu'),
    (s8,  'Tansen School of Classical Music','9 Dhrupad Marg, Gwalior, Madhya Pradesh',     'approved', 'admin.tansen@school.edu'),
    (s9,  'Bhairavi International School',   '45 Kalyani Nagar, Jaipur, Rajasthan',          'approved', 'admin.bhairavi@school.edu'),
    (s10, 'Raagmala Academy',                '2 Bandish Block, Ahmedabad, Gujarat',           'approved', 'admin.raagmala@school.edu')
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Insert auth.users (triggers profile creation) ──────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, confirmation_sent_at,
    created_at, updated_at,
    raw_user_meta_data,
    is_super_admin, is_sso_user, deleted_at
  ) VALUES
    -- School 1
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.harmony@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Harmony Admin','role','school_admin','status','approved','school_id', s1::text),
     false, false, NULL),
    -- School 2
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.melody@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Melody Admin','role','school_admin','status','approved','school_id', s2::text),
     false, false, NULL),
    -- School 3
    (u3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.rhythm@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Rhythm Admin','role','school_admin','status','approved','school_id', s3::text),
     false, false, NULL),
    -- School 4
    (u4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.sargam@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Sargam Admin','role','school_admin','status','approved','school_id', s4::text),
     false, false, NULL),
    -- School 5
    (u5, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.suron@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Suron Admin','role','school_admin','status','approved','school_id', s5::text),
     false, false, NULL),
    -- School 6
    (u6, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.nada@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Nada Admin','role','school_admin','status','approved','school_id', s6::text),
     false, false, NULL),
    -- School 7
    (u7, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.veena@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Veenavadini Admin','role','school_admin','status','approved','school_id', s7::text),
     false, false, NULL),
    -- School 8
    (u8, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.tansen@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Tansen Admin','role','school_admin','status','approved','school_id', s8::text),
     false, false, NULL),
    -- School 9
    (u9, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.bhairavi@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Bhairavi Admin','role','school_admin','status','approved','school_id', s9::text),
     false, false, NULL),
    -- School 10
    (u10, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.raagmala@school.edu', pwd_hash,
     NOW(), NOW(), NOW(), NOW(),
     jsonb_build_object('full_name','Raagmala Admin','role','school_admin','status','approved','school_id', s10::text),
     false, false, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ── 5. Ensure profiles are correctly set (in case trigger already ran) ──
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s1  WHERE id = u1;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s2  WHERE id = u2;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s3  WHERE id = u3;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s4  WHERE id = u4;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s5  WHERE id = u5;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s6  WHERE id = u6;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s7  WHERE id = u7;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s8  WHERE id = u8;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s9  WHERE id = u9;
  UPDATE public.profiles SET
    role     = 'school_admin',
    status   = 'approved',
    school_id = s10 WHERE id = u10;

END $$;

-- ── 6. Verify ────────────────────────────────────────────────────
SELECT
  s.name       AS school,
  p.email      AS login_email,
  p.role,
  p.status,
  '123456789'  AS password
FROM public.schools s
JOIN public.profiles p ON p.school_id = s.id AND p.role = 'school_admin'
WHERE s.id::text LIKE 'aaaaaaaa-%'
ORDER BY s.name;
