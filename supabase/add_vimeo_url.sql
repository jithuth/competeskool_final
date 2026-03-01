-- Add vimeo_url column to submission_videos
-- Run in Supabase SQL Editor

ALTER TABLE submission_videos
  ADD COLUMN IF NOT EXISTS vimeo_url TEXT;

-- Update any display queries that need to include vimeo_url
-- (no data migration needed — existing rows just get NULL for vimeo_url)
