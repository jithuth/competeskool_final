"use server";

import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";

export async function getCurrentUserAction() {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return null;

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);

        return {
            userId: user.$id,
            role: profile.role,
            school_id: profile.school_id
        };
    } catch (err: any) {
        // 401 Unauthorized means session expired / not present
        if (err.code !== 401) {
            console.error("Session Auth Check Error:", err.message);
        }
        return null;
    }
}
