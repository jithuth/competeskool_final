-- ============================================================
--  SEED: 10 Teachers for EACH School (100 total)
--  Classes: 1 to 10
--  Password: 123456789
--
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
    school_rec RECORD;
    class_num INTEGER;
    teacher_id UUID;
    teacher_email TEXT;
    teacher_name TEXT;
    pwd_hash TEXT;
BEGIN
    -- 1. Compute bcrypt hash for '123456789'
    pwd_hash := crypt('123456789', gen_salt('bf', 10));

    -- 2. Loop through the 10 schools we created
    FOR school_rec IN 
        SELECT id, name FROM public.schools 
        WHERE id::text LIKE 'aaaaaaaa-%' 
        ORDER BY id
    LOOP
        -- 3. Create 10 teachers for this school (Class 1 to 10)
        FOR class_num IN 1..10 LOOP
            teacher_email := lower(replace(school_rec.name, ' ', '.')) || '.teacher' || class_num || '@school.edu';
            teacher_name := 'Teacher Class ' || class_num || ' (' || school_rec.name || ')';

            -- Check if teacher already exists to avoid conflict
            IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = teacher_email) THEN
                teacher_id := extensions.uuid_generate_v4();

                -- A. Insert into auth.users
                INSERT INTO auth.users (
                    id, instance_id, aud, role,
                    email, encrypted_password,
                    email_confirmed_at, confirmation_sent_at,
                    created_at, updated_at,
                    raw_user_meta_data,
                    is_super_admin, is_sso_user
                ) VALUES (
                    teacher_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
                    teacher_email, pwd_hash,
                    NOW(), NOW(), NOW(), NOW(),
                    jsonb_build_object(
                        'full_name', teacher_name,
                        'role', 'teacher',
                        'status', 'approved',
                        'school_id', school_rec.id::text
                    ),
                    false, false
                );

                -- B. Ensure Profile exists (handle cases where trigger might be slow or disabled)
                INSERT INTO public.profiles (id, email, full_name, role, status, school_id)
                VALUES (teacher_id, teacher_email, teacher_name, 'teacher', 'approved', school_rec.id)
                ON CONFLICT (id) DO NOTHING;

                -- C. Insert into public.teachers
                INSERT INTO public.teachers (id, class_section)
                VALUES (teacher_id, 'Class ' || class_num)
                ON CONFLICT (id) DO NOTHING;
            END IF;

        END LOOP;
    END LOOP;
END $$;

-- ── 4. Verify ────────────────────────────────────────────────────
SELECT 
    s.name as school_name,
    t.class_section,
    p.full_name as teacher_name,
    p.email as teacher_email
FROM public.teachers t
JOIN public.profiles p ON t.id = p.id
JOIN public.schools s ON p.school_id = s.id
WHERE s.id::text LIKE 'aaaaaaaa-%'
ORDER BY s.name, t.class_section;
