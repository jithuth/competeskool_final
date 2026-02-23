import { createClient } from "@/lib/supabase/server";

export async function getSiteSettings() {
    try {
        const supabase = await createClient();
        const { data } = await supabase.from("site_settings").select("*");

        const settings: Record<string, string> = {};
        data?.forEach(s => {
            settings[s.key] = s.value;
        });
        return settings;
    } catch (e) {
        console.error("Failed to fetch site settings", e);
        return {};
    }
}

export async function getSeoConfig(path: string) {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("seo_configs")
            .select("*")
            .eq("page_path", path)
            .single();
        return data;
    } catch (e) {
        return null;
    }
}
