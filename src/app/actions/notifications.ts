"use server";

import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";

export async function createNotificationAction(data: {
    title: string;
    message: string;
    type: string;
    recipient_role: string;
    event_id: string;
}) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();

        if (!user) return { error: "Unauthorized" };

        const adminAppwrite = getAppwriteAdmin();

        await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "notifications", ID.unique(), {
            title: data.title,
            message: data.message,
            type: data.type,
            recipient_role: data.recipient_role,
            event_id: data.event_id,
            sender_id: user.$id
        });

        return { success: true };
    } catch (error: any) {
        console.error("Notification Error:", error);
        return { error: error.message };
    }
}

export async function getNotificationsAction() {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();

        if (!user) return [];

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
        if (!profile) return [];

        const res = await databases.listDocuments(APPWRITE_DATABASE_ID, "notifications", [
            Query.equal("recipient_role", profile.role),
            Query.orderDesc("$createdAt")
        ]);

        const notifications: any[] = [];
        for (const doc of res.documents) {
            let eventTitle = "Event";
            if (doc.event_id) {
                try {
                    const event = await databases.getDocument(APPWRITE_DATABASE_ID, "events", doc.event_id);
                    eventTitle = event.title || eventTitle;
                } catch (e) { }
            }
            notifications.push({
                ...doc,
                created_at: doc.$createdAt,
                events: { title: eventTitle }
            });
        }

        return notifications;
    } catch (e) {
        return [];
    }
}
