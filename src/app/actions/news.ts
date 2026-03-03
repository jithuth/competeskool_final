"use server";

import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

export async function getNewsAction() {
    try {
        const adminAppwrite = getAppwriteAdmin();
        const res = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "news", [
            Query.orderDesc("published_at")
        ]);
        return { success: true, documents: JSON.parse(JSON.stringify(res.documents)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createNewsAction(data: {
    title: string;
    content: string;
    image_url?: string;
    published_at: string;
}) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        if (!user) return { success: false, error: "Unauthorized" };

        const adminAppwrite = getAppwriteAdmin();
        const doc = await adminAppwrite.databases.createDocument(
            APPWRITE_DATABASE_ID,
            "news",
            ID.unique(),
            {
                ...data,
                created_by: user.$id
            }
        );

        revalidatePath("/dashboard/news");
        revalidatePath("/news");
        return { success: true, document: JSON.parse(JSON.stringify(doc)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateNewsAction(id: string, data: {
    title: string;
    content: string;
    image_url?: string;
    published_at: string;
}) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        if (!user) return { success: false, error: "Unauthorized" };

        const adminAppwrite = getAppwriteAdmin();
        const doc = await adminAppwrite.databases.updateDocument(
            APPWRITE_DATABASE_ID,
            "news",
            id,
            data
        );

        revalidatePath("/dashboard/news");
        revalidatePath("/news");
        revalidatePath(`/news/${id}`);
        return { success: true, document: JSON.parse(JSON.stringify(doc)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteNewsAction(id: string) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        if (!user) return { success: false, error: "Unauthorized" };

        const adminAppwrite = getAppwriteAdmin();
        await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "news", id);

        revalidatePath("/dashboard/news");
        revalidatePath("/news");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
