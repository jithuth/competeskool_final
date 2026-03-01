-- ============================================================
--  SEED: 6 Test Events with Banner Images
--  Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
--  Images use royalty-free Unsplash URLs — replace with your own
--  if you have uploaded assets in Supabase Storage.
-- ============================================================

INSERT INTO public.events (
    id,
    title,
    description,
    start_date,
    end_date,
    status,
    media_type,
    banner_url,
    is_private,
    school_id,
    full_rules
) VALUES

-- 1. National Vocal Championship
(
    extensions.uuid_generate_v4(),
    'National Vocal Championship 2026',
    '<p><strong>Showcase your vocal talent</strong> on the biggest online music stage in India.</p>
<p>Categories include <em>Classical</em>, <em>Semi-classical</em>, and <em>Light Music</em>. Students from Grades 4–12 are welcome.</p>
<ul>
  <li>Solo performance only</li>
  <li>Duration: 3–5 minutes</li>
  <li>Accompaniment allowed (recorded backing track)</li>
</ul>',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '30 days',
    'active',
    'video',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=80',
    false,
    NULL,
    'Only original or traditional compositions. No lip-sync. Video must be recorded in a single take without cuts.'
),

-- 2. All-India Piano Competition
(
    extensions.uuid_generate_v4(),
    'All-India Piano Competition 2026',
    '<p>An elite platform for <strong>young pianists</strong> across India to demonstrate technical mastery and musical expression.</p>
<p>Open to students in <em>Grades 1–8 of Trinity / ABRSM</em> or equivalent.</p>
<ul>
  <li>Minimum 2 contrasting pieces</li>
  <li>Total performance time: 5–10 minutes</li>
  <li>Camera must show the keyboard clearly</li>
</ul>',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '20 days',
    'active',
    'video',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1200&q=80',
    false,
    NULL,
    'Participants must submit a clear front-facing video. Sheet music is permitted on screen. Judges will evaluate tone, technique, and musicality.'
),

-- 3. Western Instrumental Fest
(
    extensions.uuid_generate_v4(),
    'Western Instrumental Fest 2026',
    '<p>Celebrate the art of <strong>Western instruments</strong> — Guitar, Violin, Flute, Saxophone, and more!</p>
<p>This open festival welcomes <em>beginners to advanced</em> players from any school.</p>
<ul>
  <li>Any recognized Western instrument</li>
  <li>Duration: 3–6 minutes per entry</li>
  <li>Group ensembles (up to 3 members) allowed in the ensemble category</li>
</ul>',
    NOW(),
    NOW() + INTERVAL '45 days',
    'active',
    'video',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
    false,
    NULL,
    'Each participant may submit one entry per instrument category. Background music is not permitted for solo entries.'
),

-- 4. Carnatic Classical Championship
(
    extensions.uuid_generate_v4(),
    'Carnatic Classical Championship 2026',
    '<p>Honouring the rich heritage of <strong>Carnatic classical music</strong>, this championship invites young talents to present ragas with precision and devotion.</p>
<p>Eligible ragams: <em>Bhairavi, Shankarabharanam, Kalyani, Kharaharapriya</em> and more.</p>
<ul>
  <li>Alapana + Kriti format preferred</li>
  <li>Duration: 5–8 minutes</li>
  <li>Accompaniment on mridangam / kanjira / ghatam permitted</li>
</ul>',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '60 days',
    'upcoming',
    'video',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    false,
    NULL,
    'Participants must clearly announce the ragam and composer before performing. Judging is based on swara accuracy, bhava, and laya.'
),

-- 5. School Choir Competition
(
    extensions.uuid_generate_v4(),
    'School Choir Competition 2026',
    '<p>Bring <strong>harmony to the stage</strong> with your school choir! This competition celebrates the beauty of collective voice.</p>
<p>Choirs of <em>8 to 30 members</em> are encouraged to participate with a mixed repertoire.</p>
<ul>
  <li>Minimum 2 songs: one Indian, one international</li>
  <li>Total duration: 6–10 minutes</li>
  <li>Costumes/uniforms encouraged</li>
</ul>',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '50 days',
    'upcoming',
    'video',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1200&q=80',
    false,
    NULL,
    'One entry per school. Recording must show all choir members. A teacher coordinator must be present during the recording.'
),

-- 6. Music Composition & Arrangement Challenge
(
    extensions.uuid_generate_v4(),
    'Music Composition & Arrangement Challenge 2026',
    '<p>Got a <strong>melody in your mind?</strong> Our composition challenge invites young creators to submit original musical works.</p>
<p>Submissions accepted in <em>any genre</em>: Classical, Jazz, Fusion, Pop, or Film.</p>
<ul>
  <li>Original composition only — no covers</li>
  <li>Duration: 2–5 minutes</li>
  <li>Submit as audio file (MP3/WAV) or video performance</li>
  <li>Score PDF is optional but encouraged</li>
</ul>',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '75 days',
    'upcoming',
    'audio',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80',
    false,
    NULL,
    'The composition must be entirely original. AI-generated music is not permitted. Participants retain full copyright of their work.'
);

-- ============================================================
-- Verify
-- ============================================================
SELECT id, title, status, media_type, end_date, banner_url
FROM public.events
ORDER BY end_date ASC;
