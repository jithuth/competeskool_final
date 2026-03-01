-- ============================================================
--  SEED: 5 Students for EACH Class (1 to 10) for EACH School (10 total)
--  Total students: 10 schools * 10 classes * 5 students = 500 students
--  Password: 123456789
--
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
    school_rec RECORD;
    class_num INTEGER;
    student_num INTEGER;
    student_id UUID;
    teacher_id UUID;
    student_email TEXT;
    student_name TEXT;
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
        -- 3. Loop through classes 1 to 10
        FOR class_num IN 1..10 LOOP
            
            -- Get teacher_id for this school and class (if exists from previous seed)
            SELECT p.id INTO teacher_id
            FROM public.profiles p
            JOIN public.teachers t ON p.id = t.id
            WHERE p.school_id = school_rec.id 
              AND t.class_section = 'Class ' || class_num
            LIMIT 1;

            -- 4. Create 5 students for this class
            FOR student_num IN 1..5 LOOP
                student_email := lower(replace(school_rec.name, ' ', '.')) || '.class' || class_num || '.student' || student_num || '@school.edu';
                student_name := 'Student ' || student_num || ' Class ' || class_num || ' (' || school_rec.name || ')';

                -- Check if student already exists to avoid conflict
                IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = student_email) THEN
                    student_id := extensions.uuid_generate_v4();

                    -- A. Insert into auth.users
                    INSERT INTO auth.users (
                        id, instance_id, aud, role,
                        email, encrypted_password,
                        email_confirmed_at, confirmation_sent_at,
                        created_at, updated_at,
                        raw_user_meta_data,
                        is_super_admin, is_sso_user
                    ) VALUES (
                        student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
                        student_email, pwd_hash,
                        NOW(), NOW(), NOW(), NOW(),
                        jsonb_build_object(
                            'full_name', student_name,
                            'role', 'student',
                            'status', 'approved',
                            'school_id', school_rec.id::text
                        ),
                        false, false
                    );

                    -- B. Ensure Profile exists
                    INSERT INTO public.profiles (id, email, full_name, role, status, school_id)
                    VALUES (student_id, student_email, student_name, 'student', 'approved', school_rec.id)
                    ON CONFLICT (id) DO NOTHING;

                    -- C. Insert into public.students
                    INSERT INTO public.students (id, grade_level, teacher_id, father_name, mother_name)
                    VALUES (
                        student_id, 
                        'Class ' || class_num, 
                        teacher_id,
                        'Father of ' || student_name,
                        'Mother of ' || student_name
                    ) ON CONFLICT (id) DO NOTHING;
                END IF;

            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ── 5. Verify ────────────────────────────────────────────────────
SELECT 
    s.name as school_name,
    st.grade_level,
    count(*) as student_count
FROM public.students st
JOIN public.profiles p ON st.id = p.id
JOIN public.schools s ON p.school_id = s.id
WHERE s.id::text LIKE 'aaaaaaaa-%'
GROUP BY s.name, st.grade_level
ORDER BY s.name, st.grade_level;
