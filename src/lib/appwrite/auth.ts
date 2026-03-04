import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";

/**
 * Helper to ensure the performing user is at least a school_admin or super_admin.
 */
export async function assertAdmin() {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { authorized: false, error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
        const isAdmin = profile?.role === "super_admin" || profile?.role === "school_admin";

        return { authorized: isAdmin, user, role: profile?.role, schoolId: profile?.school_id };
    } catch (e: any) {
        return { authorized: false, error: e.message };
    }
}

/**
 * Helper to ensure the performing user is a super_admin.
 */
export async function assertSuperAdmin() {
    const auth = await assertAdmin();
    if (!auth.authorized) return { authorized: false, error: auth.error || "Access Denied" };
    if (auth.role !== "super_admin") return { authorized: false, error: "Super Admin privileges required" };
    return auth;
}
