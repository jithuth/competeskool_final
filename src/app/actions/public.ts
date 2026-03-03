"use server";

import { getAppwriteAdmin, APPWRITE_DATABASE_ID } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

export async function getApprovedSchoolsAction() {
    try {
        const adminAppwrite = getAppwriteAdmin();
        const response = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "schools", [
            Query.equal("status", "approved"),
            Query.limit(100)
        ]);
        return {
            success: true,
            schools: response.documents.map(s => ({
                id: s.$id,
                name: s.name
            }))
        };
    } catch (e: any) {
        console.error("Error fetching schools:", e);
        return { error: e.message || "Failed to fetch schools" };
    }
}

export async function getSchoolTeachersAction(schoolId: string) {
    try {
        const adminAppwrite = getAppwriteAdmin();

        // 1. Fetch Teachers for this school from profiles
        const teacherProfiles = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", [
            Query.equal("school_id", schoolId),
            Query.equal("role", "teacher"),
            Query.equal("status", "approved"),
            Query.limit(100)
        ]);

        // 2. We have their names, but we need their class_section from the 'teachers' collection
        const resolvedTeachers: any[] = [];
        for (let t of teacherProfiles.documents) {
            try {
                const tDetails = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "teachers", t.$id);
                resolvedTeachers.push({
                    id: t.$id,
                    full_name: t.full_name,
                    grade: tDetails.class_section || "Unassigned"
                });
            } catch (e) {
                // Teacher profile details missing
            }
        }

        return { success: true, teachers: resolvedTeachers };
    } catch (e: any) {
        console.error("Error fetching teachers:", e);
        return { error: e.message || "Failed to fetch teachers" };
    }
}
