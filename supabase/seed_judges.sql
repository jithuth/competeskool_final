-- ============================================================
--  SEED: 20 Judges
--  Password: 123456789
--
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
    judge_num INTEGER;
    judge_id UUID;
    judge_email TEXT;
    judge_name TEXT;
    pwd_hash TEXT;
    expertises TEXT[] := ARRAY['Vocal Classical', 'Piano', 'Violin', 'Guitar', 'Carnatic Music', 'Choral Conducting', 'Music Composition', 'Wind Instruments', 'Music Theory', 'Percussion'];
BEGIN
    -- 1. Compute bcrypt hash for '123456789'
    pwd_hash := crypt('123456789', gen_salt('bf', 10));

    -- 2. Create 20 judges
    FOR judge_num IN 1..20 LOOP
        judge_email := 'judge' || judge_num || '@competeedu.com';
        judge_name := 'Judge ' || judge_num;

        -- Check if judge already exists to avoid conflict
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = judge_email) THEN
            judge_id := extensions.uuid_generate_v4();

            -- A. Insert into auth.users
            INSERT INTO auth.users (
                id, instance_id, aud, role,
                email, encrypted_password,
                email_confirmed_at, confirmation_sent_at,
                created_at, updated_at,
                raw_user_meta_data,
                is_super_admin, is_sso_user
            ) VALUES (
                judge_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
                judge_email, pwd_hash,
                NOW(), NOW(), NOW(), NOW(),
                jsonb_build_object(
                    'full_name', judge_name,
                    'role', 'judge',
                    'status', 'approved'
                ),
                false, false
            );

            -- B. Ensure Profile exists
            INSERT INTO public.profiles (id, email, full_name, role, status)
            VALUES (judge_id, judge_email, judge_name, 'judge', 'approved')
            ON CONFLICT (id) DO NOTHING;

            -- C. Insert into public.judges
            INSERT INTO public.judges (id, expertise, bio)
            VALUES (
                judge_id, 
                expertises[(judge_num % 10) + 1],
                'Distinguished expert in ' || expertises[(judge_num % 10) + 1] || ' with over 15 years of international experience.'
            ) ON CONFLICT (id) DO NOTHING;
        END IF;

    END LOOP;
END $$;

-- ── 3. Verify ────────────────────────────────────────────────────
SELECT 
    p.full_name as judge_name,
    p.email as judge_email,
    j.expertise,
    p.status
FROM public.judges j
JOIN public.profiles p ON j.id = p.id
ORDER BY p.email;
