-- Reset entire schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable UUID extension just in case
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Role types
CREATE TYPE public.user_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'student', 'judge');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  admin_email TEXT, -- Person who registered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (Users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT,
  email TEXT UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_section TEXT
);

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone TEXT,
  father_name TEXT,
  mother_name TEXT,
  grade_level TEXT,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL
);

-- Judges
CREATE TABLE public.judges (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  expertise TEXT,
  bio TEXT
);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'upcoming',
  created_by UUID REFERENCES public.profiles(id),
  banner_url TEXT,
  media_type TEXT DEFAULT 'video',
  full_rules TEXT
);

-- Submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  score DECIMAL(5,2),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submission Videos
CREATE TABLE public.submission_videos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  video_url TEXT,
  youtube_url TEXT,
  storage_path TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News, Gallery, Winners, Rankings
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id),
  student_id UUID REFERENCES public.profiles(id),
  rank INTEGER,
  prize TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.rankings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id),
  total_score DECIMAL(10,2),
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--
-- AUTO-SYNC TRIGGER FROM AUTH.USERS -> PUBLIC.PROFILES
--
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  extracted_role public.user_role;
  extracted_status public.approval_status;
  extracted_school_id text;
BEGIN
  -- Default mappings if absent
  BEGIN
    extracted_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    extracted_role := 'student'::public.user_role;
  END;

  BEGIN
    extracted_status := COALESCE(NEW.raw_user_meta_data->>'status', 'pending')::public.approval_status;
  EXCEPTION WHEN invalid_text_representation THEN
    extracted_status := 'pending'::public.approval_status;
  END;

  extracted_school_id := NEW.raw_user_meta_data->>'school_id';

  INSERT INTO public.profiles (id, email, full_name, role, status, school_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    extracted_role,
    extracted_status,
    CASE 
      WHEN extracted_school_id IN ('', 'null', 'undefined') THEN NULL
      ELSE extracted_school_id::UUID 
    END
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to bypass failing conversions
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'student'::public.user_role,
    'pending'::public.approval_status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure auth changes trigger profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Sync profile update back to Auth OR handle Profile soft-deletes (delete users)
CREATE OR REPLACE FUNCTION public.sync_profile_updates()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.email <> NEW.email THEN
      UPDATE auth.users SET email = NEW.email WHERE id = NEW.id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM auth.users WHERE id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_sync ON public.profiles;
CREATE TRIGGER on_profile_sync
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.sync_profile_updates();


-- Handle School Approvals dynamically promoting profiles
CREATE OR REPLACE FUNCTION public.handle_school_approval()
RETURNS trigger AS $$
BEGIN
  IF (NEW.status = 'approved' AND OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET role = 'school_admin',
        status = 'approved',
        school_id = NEW.id
    WHERE email = NEW.admin_email;
  END IF;
  
  IF (NEW.status = 'pending' AND OLD.status = 'approved') THEN
    UPDATE public.profiles
    SET status = 'pending'
    WHERE school_id = NEW.id AND role = 'school_admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_school_status_change
  AFTER UPDATE OF status ON public.schools
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_school_approval();

--
-- DISABLE ALL RLS TO REMAIN BACK-OFFICE CONTROLLED ONLY 
--
ALTER TABLE public.schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings DISABLE ROW LEVEL SECURITY;

--
-- BACKFILL EXISTING AUTH USERS TO PROFILES
--
INSERT INTO public.profiles (id, email, full_name, role, status, school_id)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  CASE
    WHEN raw_user_meta_data->>'role' IN ('super_admin', 'school_admin', 'teacher', 'student', 'judge')
    THEN (raw_user_meta_data->>'role')::public.user_role
    ELSE 'student'::public.user_role
  END,
  CASE
    WHEN raw_user_meta_data->>'status' IN ('pending', 'approved', 'rejected')
    THEN (raw_user_meta_data->>'status')::public.approval_status
    ELSE 'approved'::public.approval_status
  END,
  CASE
    WHEN raw_user_meta_data->>'school_id' IN ('', 'null', 'undefined') THEN NULL
    WHEN raw_user_meta_data->>'school_id' IS NULL THEN NULL
    ELSE (raw_user_meta_data->>'school_id')::UUID
  END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

--
-- RESTORE API PRIVILEGES
-- (Dropping the public schema cascades and ruins default PostgREST grants for Anon & Authenticated. We restore them here)
--
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
