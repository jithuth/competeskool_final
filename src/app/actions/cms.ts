"use server";

import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";

export async function saveSiteSettingsAction(settings: any[]) {
    try {
        const adminAppwrite = getAppwriteAdmin();

        for (const item of settings) {
            const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "site_settings", [
                Query.equal("key", item.key)
            ]);

            const payload = {
                key: item.key,
                value: item.value,
                type: item.type,
                category: item.category,
                description: item.description,
            };

            if (existing.documents.length > 0) {
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "site_settings", existing.documents[0].$id, payload);
            } else {
                await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "site_settings", ID.unique(), payload);
            }
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
        const adminAppwrite = getAppwriteAdmin();

        for (const item of configs) {
            const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "seo_configs", [
                Query.equal("page_path", item.page_path)
            ]);

            const payload = {
                page_path: item.page_path,
                title: item.title,
                description: item.description,
                keywords: item.keywords,
                og_image_url: item.og_image_url,
            };

            if (existing.documents.length > 0) {
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "seo_configs", existing.documents[0].$id, payload);
            } else {
                await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "seo_configs", ID.unique(), payload);
            }
        }

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
