-- Frontend Management & SEO Tables

-- 1. Site Settings for general content control
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    type TEXT DEFAULT 'text', -- 'text', 'html', 'image_url', 'color', 'json'
    category TEXT DEFAULT 'general', -- 'home', 'about', 'appearance', 'contact'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SEO Configurations for page-level meta tags
CREATE TABLE IF NOT EXISTS public.seo_configs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    page_path TEXT UNIQUE NOT NULL, -- e.g., '/', '/about', '/competitions'
    title TEXT,
    description TEXT,
    keywords TEXT, -- comma-separated
    og_image_url TEXT,
    canonical_url TEXT,
    no_index BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial SEO Data
INSERT INTO public.seo_configs (page_path, title, description, keywords)
VALUES 
('/', 'CompeteEdu India | National School Excellence Platform', 'India''s premier platform for fostering academic excellence and competitive spirit in schools nationwide.', 'school competitions, india, academic excellence, student awards'),
('/about', 'About Us | CompeteEdu India', 'Architecture of Indian Talent - CompeteEdu is a national educational platform dedicated to student excellence.', 'about us, education india, student development'),
('/competitions', 'All-India Competitions 2026 | CompeteEdu', 'Explore prestigious school awards and creative challenges across India.', 'competitions 2026, school awards, national talent search'),
('/winners', 'Winners Gallery | National Laureates 2026', 'Celebrating the extraordinary achievements of our national student community.', 'competition winners, school laureates, student achievements'),
('/gallery', 'Visual Archives | CompeteEdu India', 'Moments of student breakthroughs and artistic spirit from across the country.', 'event photos, student gallery, school events')
ON CONFLICT (page_path) DO NOTHING;

-- Seed Initial Content for Home Page
INSERT INTO public.site_settings (key, value, description, type, category)
VALUES 
('home_hero_title', 'All-India National Talent Search', 'Main title on home page hero', 'text', 'home'),
('home_hero_subtitle', '2026 Season', 'Subtitle on home page hero', 'text', 'home'),
('home_hero_description', 'Showcase your institutional talent on India''s most prestigious online talent platform.', 'Description on home page hero', 'text', 'home'),
('home_hero_image', '/national_talent_search_poster_1771809515695.png', 'Background image for home hero', 'image_url', 'home'),
('contact_email', 'support@competeedu.in', 'Official contact email', 'text', 'general'),
('footer_copy', '© 2026 CompeteEdu India. All Rights Reserved.', 'Copyright text in footer', 'text', 'general')
ON CONFLICT (key) DO NOTHING;

-- Disable RLS (as per previous schema pattern)
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_configs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.site_settings TO anon, authenticated, service_role;
GRANT ALL ON public.seo_configs TO anon, authenticated, service_role;
