-- Phase 4: Evaluation System — Full Migration
-- Run this in Supabase SQL Editor in order

-- ─────────────────────────────────────────────────
-- 1. Add results columns to events
-- ─────────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS results_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────
-- 2. Judges profile extension
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS judges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  expertise   TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 3. Event–Judge assignments
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_judges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
  judge_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by  UUID REFERENCES profiles(id),
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, judge_id)
);

-- ─────────────────────────────────────────────────
-- 4. Evaluation rubric (criteria per event)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID REFERENCES events(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  max_score     INT  NOT NULL DEFAULT 10,
  weight        DECIMAL NOT NULL DEFAULT 1.0,   -- percentage weight (0–100)
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 5. Judge scores (per judge × submission × criterion)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submission_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id      UUID REFERENCES profiles(id),
  criterion_id  UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  score         DECIMAL NOT NULL,
  feedback      TEXT,
  scored_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, judge_id, criterion_id)
);

-- ─────────────────────────────────────────────────
-- 6. Computed results cache (populated server-side on lock)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submission_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID REFERENCES submissions(id) ON DELETE CASCADE UNIQUE,
  event_id       UUID REFERENCES events(id),
  student_id     UUID REFERENCES profiles(id),
  raw_score      DECIMAL DEFAULT 0,
  weighted_score DECIMAL DEFAULT 0,
  judge_count    INT DEFAULT 0,
  rank           INT,
  tier           TEXT DEFAULT 'participant', -- gold | silver | bronze | participant
  computed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 7. Blockchain-verified badges
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id        TEXT UNIQUE NOT NULL,      -- CE-2026-XXXXXXXX
  credential_hash      TEXT NOT NULL,             -- SHA-256 tamper-proof
  submission_result_id UUID REFERENCES submission_results(id),
  student_id           UUID REFERENCES profiles(id),
  event_id             UUID REFERENCES events(id),
  tier                 TEXT NOT NULL,             -- gold | silver | bronze | participant
  rank                 INT,
  weighted_score       DECIMAL,
  -- Denormalized for fast display:
  student_name         TEXT NOT NULL,
  school_name          TEXT NOT NULL,
  event_name           TEXT NOT NULL,
  issued_by            TEXT NOT NULL,
  issued_at            TIMESTAMPTZ DEFAULT NOW(),
  is_public            BOOLEAN DEFAULT TRUE,
  download_count       INT DEFAULT 0,
  share_count          INT DEFAULT 0
);

-- ─────────────────────────────────────────────────
-- 8. Disable RLS on new tables (adjust as needed)
-- ─────────────────────────────────────────────────
ALTER TABLE judges               DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_judges         DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria  DISABLE ROW LEVEL SECURITY;
ALTER TABLE submission_scores    DISABLE ROW LEVEL SECURITY;
ALTER TABLE submission_results   DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges               DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────
-- 9. Grant access to authenticated users
-- ─────────────────────────────────────────────────
GRANT ALL ON judges, event_judges, evaluation_criteria,
             submission_scores, submission_results, badges
TO authenticated, anon, service_role;

-- ─────────────────────────────────────────────────
-- Done! Now you can:
-- 1. Go to /dashboard/judges to add judges
-- 2. Go to /dashboard/events → click "Evaluate" on any event
-- 3. Build rubric, assign judges, open scoring
-- 4. Lock & compute results, then publish
-- 5. /winners, /verify/[id], /dashboard/my-results all go live automatically
-- ─────────────────────────────────────────────────
