-- Increase submissions bucket file size limit to 500 MB
-- and ensure video MIME types are allowed
UPDATE storage.buckets
SET
    file_size_limit = 524288000,   -- 500 MB in bytes
    allowed_mime_types = ARRAY[
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        'video/webm', 'video/ogg', 'video/3gpp', 'video/x-matroska',
        'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac',
        'audio/flac', 'audio/x-m4a',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
WHERE id = 'submissions';
