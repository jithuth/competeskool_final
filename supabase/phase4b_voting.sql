-- ─────────────────────────────────────────────────────────────────
-- Phase 4b: Public Voting + Scoring Deadline
-- Run in Supabase SQL Editor after phase4_evaluation.sql
-- ─────────────────────────────────────────────────────────────────

-- 1. Add scoring_deadline and public_vote_weight to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS scoring_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_vote_weight DECIMAL DEFAULT 20; -- % of final score from public votes

-- 2. submission_votes — one vote per IP per submission (public)
CREATE TABLE IF NOT EXISTS submission_votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  voter_ip      TEXT NOT NULL,                -- hashed IP for privacy
  voted_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, voter_ip)             -- one vote per IP per submission
);

-- 3. Add public_vote_score column to submission_results
ALTER TABLE submission_results
  ADD COLUMN IF NOT EXISTS public_vote_score DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS public_vote_count  INT DEFAULT 0;

-- 4. Permissions
ALTER TABLE submission_votes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON submission_votes TO authenticated, anon, service_role;

-- 5. Auto-set scoring_deadline trigger: end_date + 15 days
CREATE OR REPLACE FUNCTION set_scoring_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.scoring_deadline IS NULL THEN
    NEW.scoring_deadline := NEW.end_date + INTERVAL '15 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_scoring_deadline ON events;
CREATE TRIGGER trg_set_scoring_deadline
  BEFORE INSERT OR UPDATE OF end_date ON events
  FOR EACH ROW EXECUTE FUNCTION set_scoring_deadline();

-- 6. Update existing events to have scoring_deadline if missing
UPDATE events
SET scoring_deadline = end_date + INTERVAL '15 days'
WHERE scoring_deadline IS NULL AND end_date IS NOT NULL;

-- Done!
-- scoring_deadline is auto-set to 15 days after event end_date
-- public votes are stored in submission_votes (one per IP)
-- public_vote_weight on event controls what % of final score public votes contribute
