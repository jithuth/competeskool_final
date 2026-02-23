"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSiteSettingsAction(settings: any[]) {
    try {
        const supabase = await createClient();

        for (const item of settings) {
            const { error } = await supabase
                .from("site_settings")
                .upsert({
                    key: item.key,
                    value: item.value,
                    type: item.type,
                    category: item.category,
                    description: item.description,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
        }

        revalidatePath("/");
        revalidatePath("/about");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function saveSeoConfigAction(configs: any[]) {
    try {
        const supabase = await createClient();

        for (const item of configs) {
            const { error } = await supabase
                .from("seo_configs")
                .upsert({
                    page_path: item.page_path,
                    title: item.title,
                    description: item.description,
                    keywords: item.keywords,
                    og_image_url: item.og_image_url,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'page_path' });

            if (error) throw error;
        }

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
