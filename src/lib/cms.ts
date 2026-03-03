import { createAdminClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { Query } from "node-appwrite";

/** Returns true only if the string is a valid http/https URL */
function isValidUrl(str: string | undefined | null): boolean {
    if (!str) return false;
    try {
        const u = new URL(str);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

// Keys that must contain valid image URLs — invalid values are cleared
const IMAGE_SETTING_KEYS = ["site_logo", "home_hero_image", "og_image_url"];

export async function getSiteSettings() {
    try {
        const { databases } = await createAdminClient();
        const settings: Record<string, string> = {};

        const data = await databases.listDocuments(APPWRITE_DATABASE_ID, "site_settings");
        data.documents.forEach((s: any) => {
            const val: string = s.value;
            // For image keys, discard the value if it's not a real URL
            if (IMAGE_SETTING_KEYS.includes(s.key)) {
                if (isValidUrl(val)) {
                    settings[s.key] = val;
                }
                // else: skip — don't add broken value like "[object Promise]"
            } else {
                settings[s.key] = val;
            }
        });

        return settings;
    } catch (e) {
        console.error("Failed to fetch site settings", e);
        return {};
    }
}

export async function getSeoConfig(path: string) {
    try {
        const { databases } = await createAdminClient();
        const data = await databases.listDocuments(APPWRITE_DATABASE_ID, "seo_configs", [
            Query.equal("page_path", path),
            Query.limit(1)
        ]);
        return data.documents.length > 0 ? data.documents[0] : null;
    } catch (e) {
        return null;
    }
}
