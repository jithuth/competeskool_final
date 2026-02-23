-- Create a new bucket for submissions if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view submissions
CREATE POLICY "Public Access Submission Media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'submissions' );

-- Allow authenticated users (students) to upload their media
CREATE POLICY "Authenticated Users Upload Submission"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'submissions' 
    AND auth.role() = 'authenticated'
);

-- Allow owners to delete their own media (optional but recommended)
CREATE POLICY "Owners Delete own Submission Media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'submissions' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);
