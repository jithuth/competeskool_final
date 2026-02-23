-- Fix Storage RLS Policies
-- This script allows public/authenticated uploads to specific buckets used by the platform.

-- 1. Ensure the buckets exist (in case setup script failed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true),
       ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public/Authenticated Uploads to 'public-assets'
CREATE POLICY "Allow Public Uploads to public-assets"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'public-assets');

CREATE POLICY "Allow Public Update to public-assets"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'public-assets');

CREATE POLICY "Allow Public Delete from public-assets"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'public-assets');

CREATE POLICY "Allow Public Select from public-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');


-- 3. Allow Public/Authenticated Uploads to 'event-banners'
CREATE POLICY "Allow Public Uploads to event-banners"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'event-banners');

CREATE POLICY "Allow Public Update to event-banners"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'event-banners');

CREATE POLICY "Allow Public Delete from event-banners"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'event-banners');

CREATE POLICY "Allow Public Select from event-banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-banners');

-- 4. Alternative: Completely disable RLS for storage objects (Broadest access)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
