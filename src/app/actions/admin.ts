"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin, APPWRITE_BUCKET_ID } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

/**
 * Uploads a file to Appwrite Storage using Admin privileges.
 * Useful for bypassing "Missing permission" errors on the client side.
 */
export async function uploadFileAction(formData: FormData) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const file = formData.get("file") as File;
        if (!file) return { error: "No file provided" };

        const adminAppwrite = getAppwriteAdmin();
        const buffer = Buffer.from(await file.arrayBuffer());

        const fileId = ID.unique();
        await adminAppwrite.storage.createFile(
            APPWRITE_BUCKET_ID,
            fileId,
            InputFile.fromBuffer(buffer, file.name)
        );

        // Construct the public view URL directly - getFileView returns ArrayBuffer (binary), not a URL
        const publicUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;

        return {
            success: true,
            url: publicUrl,
            path: fileId,
            fileId: fileId
        };
    } catch (e: any) {
        console.error("Server upload failed:", e);
        return { error: e.message || "Failed to upload file to storage" };
    }
}

export async function createAdminUserAction(values: any) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, 'profiles', user.$id);
        if (!profile || (profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
            return { error: "Insufficient permissions" };
        }

        const adminAppwrite = getAppwriteAdmin();
        const newUserId = ID.unique();

        // 1. Create Identity
        const newUser = await adminAppwrite.users.create(
            newUserId,
            values.email,
            undefined, // Phone missing
            values.password,
            values.full_name
        );

        // 2. Profile created automatically via Appwrite function/webhook or manually? 
        // Best approach is manually pushing the profile if it needs it synchronously
        try {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "profiles", newUser.$id, {
                email: values.email,
                full_name: values.full_name,
                role: values.role,
                school_id: values.school_id || null,
                status: 'approved'
            });
        } catch (e) { }

        // 3. Upsert Role Details
        if (values.role === 'teacher') {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "teachers", newUser.$id, {
                class_section: values.class_section
            });
        } else if (values.role === 'judge') {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "judges", newUser.$id, {
                expertise: values.expertise,
                bio: values.bio
            });
        }

        return { success: true, userId: newUser.$id };
    } catch (e: any) {
        return { error: e.message || "Failed to create admin user" };
    }
}

export async function saveEventAction(data: any) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, 'profiles', user.$id);
        if (!profile || (profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
            return { error: "Insufficient permissions to manage competitions." };
        }

        const adminAppwrite = getAppwriteAdmin();

        // Only pass fields that exist in the events collection schema.
        // Form-only fields like `is_private` must be excluded.
        const ALLOWED_FIELDS = new Set([
            "title", "description", "start_date", "end_date",
            "status", "results_status", "created_by", "banner_url",
            "media_type", "full_rules", "school_id",
        ]);

        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([k, v]) =>
                ALLOWED_FIELDS.has(k) && v !== undefined
            )
        );

        if (data.id) {
            await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "events", data.id as string, cleanData);
        } else {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "events", ID.unique(), cleanData);
        }

        return { success: true };
    } catch (e: any) {
        console.error("Database Error:", e);
        return { error: `Database Error: ${e.message}` };
    }
}

export async function sendBulkEventEmailAction(eventId: string) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const adminAppwrite = getAppwriteAdmin();

        // 1. Get Event Details
        const event = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, 'events', eventId);
        if (!event) return { error: "Event not found" };

        // 2. Get All School Admin Emails
        const resAdmins = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, 'profiles', [
            Query.equal('role', 'school_admin')
        ]);
        const schoolAdmins = resAdmins.documents;

        // 3. Simulate sending emails
        console.log(`[BULK EMAIL] Initializing broadcast for: ${event.title}`);
        schoolAdmins.forEach(admin => {
            console.log(`[SIMULATED] Sending invitation to ${admin.full_name} (${admin.email}) for event: ${event.title}`);
        });

        return { success: true, count: schoolAdmins.length };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function saveUserProfileAction(data: any) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, 'profiles', user.$id);

        const adminAppwrite = getAppwriteAdmin();
        const targetProfile = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, 'profiles', data.id);

        const canEdit = profile.role === 'super_admin' ||
            (profile.role === 'school_admin' && profile.school_id === targetProfile.school_id) ||
            (profile.role === 'teacher' && targetProfile.role === 'student');

        if (!canEdit) return { error: "Insufficient permissions" };

        const updateData: any = { full_name: data.full_name };
        if (profile.role === 'super_admin' && data.school_id) {
            updateData.school_id = data.school_id;
        }

        // Update Profile
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, 'profiles', data.id, updateData);

        // Update Role Specific Data
        if (targetProfile.role === 'teacher' && data.class_section) {
            await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, 'teachers', data.id, { class_section: data.class_section });
        } else if (targetProfile.role === 'student' && data.grade_level) {
            await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, 'students', data.id, { grade_level: data.grade_level });
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function saveSystemSettingsAction(settings: Record<string, string>) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, 'profiles', user.$id);
        if (profile?.role !== 'super_admin') return { error: "Insufficient permissions" };

        const adminAppwrite = getAppwriteAdmin();

        // Appwrite lacks native `upsert` array, so we must fetch and update individually.
        for (const [key, value] of Object.entries(settings)) {
            const exists = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, 'site_settings', [
                Query.equal('key', key),
                Query.limit(1) // Avoid multiple fetch overhead
            ]);

            if (exists.documents.length > 0) {
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, 'site_settings', exists.documents[0].$id, { value });
            } else {
                await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, 'site_settings', ID.unique(), { key, value });
            }
        }

        revalidatePath("/", "layout");
        revalidatePath("/dashboard", "layout");

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateSchoolAction(id: string, values: { name: string, address: string }) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, 'profiles', user.$id);
        if (profile.role !== 'school_admin' && profile.role !== 'super_admin') {
            return { error: "Insufficient permissions" };
        }

        if (profile.role === 'school_admin' && profile.school_id !== id) {
            return { error: "Direct access violation" };
        }

        const adminAppwrite = getAppwriteAdmin();
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "schools", id, values);

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getApprovedSchoolsAction() {
    try {
        const adminAppwrite = getAppwriteAdmin();
        const schools = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "schools", [
            Query.equal("status", "approved")
        ]);
        return { data: JSON.parse(JSON.stringify(schools.documents)) };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteProfileAction(id: string) {
    try {
        const adminAppwrite = getAppwriteAdmin();

        // Remove from auth
        await adminAppwrite.users.delete(id);

        // Document should be removed by cascade if planned, but let's do it manually if not
        // In our setup-appwrite-db.js, we don't have explicit cascades yet
        await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "profiles", id);

        revalidatePath("/dashboard/teachers");
        revalidatePath("/dashboard/students");
        revalidatePath("/dashboard/judges");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateProfileStatusAction(id: string, status: 'approved' | 'rejected') {
    try {
        const adminAppwrite = getAppwriteAdmin();
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "profiles", id, { status });

        revalidatePath("/dashboard/teachers");
        revalidatePath("/dashboard/students");
        revalidatePath("/dashboard/judges");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

/**
 * Creates a submission and its associated media record using Admin privileges.
 * Bypasses client-side permission issues.
 */
export async function createSubmissionAction(values: {
    title: string,
    description: string,
    event_id: string,
    media?: {
        video_url?: string;
        youtube_url?: string;
        vimeo_url?: string;
        storage_path?: string;
        type: string;
    }
}) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const adminAppwrite = getAppwriteAdmin();

        // 1. Check for duplicate
        const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submissions", [
            Query.equal("event_id", values.event_id),
            Query.equal("student_id", user.$id),
            Query.limit(1)
        ]);

        if (existing.documents.length > 0) {
            return { error: "You have already submitted to this competition." };
        }

        const submissionId = ID.unique();

        // 2. Create primary submission document
        const submission = await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "submissions", submissionId, {
            title: values.title,
            description: values.description,
            event_id: values.event_id,
            student_id: user.$id,
            status: 'pending',
            created_at: new Date().toISOString(),
        });

        // 3. Create media details document if provided
        if (values.media) {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "submission_videos", ID.unique(), {
                submission_id: submission.$id,
                video_url: values.media.video_url || null,
                youtube_url: values.media.youtube_url || null,
                vimeo_url: values.media.vimeo_url || null,
                storage_path: values.media.storage_path || null,
                type: values.media.type,
                created_at: new Date().toISOString(),
            });
        }

        revalidatePath("/dashboard/my-submissions");
        revalidatePath("/dashboard/submissions");
        return { success: true, submissionId: submission.$id };
    } catch (e: any) {
        console.error("Submission creation failed:", e);
        return { error: e.message || "Failed to create submission" };
    }
}

/**
 * Updates an existing submission and its media record using Admin privileges.
 */
export async function updateSubmissionAction(id: string, values: {
    title: string,
    description: string,
    youtube_url?: string;
}) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const adminAppwrite = getAppwriteAdmin();

        // Load submission to verify ownership
        const submission = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "submissions", id);
        if (submission.student_id !== user.$id) return { error: "Unauthorized" };
        if (submission.status !== 'pending') return { error: "Only pending submissions can be edited" };

        // 1. Update primary submission document
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "submissions", id, {
            title: values.title,
            description: values.description,
        });

        // 2. Update media if youtube_url provided (assuming edit is for youtube type in this specific flow)
        if (values.youtube_url !== undefined) {
            const videosRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_videos", [
                Query.equal("submission_id", id)
            ]);

            if (videosRes.documents.length > 0) {
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "submission_videos", videosRes.documents[0].$id, {
                    youtube_url: values.youtube_url,
                    video_url: null,
                    storage_path: null,
                    type: 'youtube'
                });
            }
        }

        revalidatePath("/dashboard/my-submissions");
        revalidatePath("/dashboard/submissions");
        revalidatePath(`/dashboard/submissions/${id}`);
        return { success: true };
    } catch (e: any) {
        console.error("Submission update failed:", e);
        return { error: e.message || "Failed to update submission" };
    }
}

export async function saveSchoolAction(values: any) {
    try {
        const adminAppwrite = getAppwriteAdmin();

        if (values.id) {
            await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "schools", values.id, {
                name: values.name,
                address: values.address,
                logo_url: values.logo_url
            });
        } else {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "schools", ID.unique(), {
                name: values.name,
                address: values.address,
                logo_url: values.logo_url,
                status: 'approved'
            });
        }

        revalidatePath("/dashboard/schools");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getSchoolStatsAction(schoolId: string) {
    try {
        const adminAppwrite = getAppwriteAdmin();

        const teachers = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", [
            Query.equal("school_id", schoolId),
            Query.equal("role", "teacher")
        ]);

        const students = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", [
            Query.equal("school_id", schoolId),
            Query.equal("role", "student")
        ]);

        return {
            data: {
                teachers: teachers.total,
                students: students.total
            }
        };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function resetSubmissionAction(id: string) {
    try {
        const adminAppwrite = getAppwriteAdmin();

        // 1. Find and delete associated videos
        const videosRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_videos", [
            Query.equal("submission_id", id)
        ]);

        for (const video of videosRes.documents) {
            await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "submission_videos", video.$id);
        }

        // 2. Delete the submission
        await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "submissions", id);

        revalidatePath("/dashboard/submissions");
        revalidatePath("/dashboard/my-submissions");
        return { success: true };
    } catch (e: any) {
        console.error("Submission reset failed:", e);
        return { error: e.message || "Failed to reset submission" };
    }
}

export async function deleteSchoolAction(id: string) {
    try {
        const adminAppwrite = getAppwriteAdmin();
        await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "schools", id);
        revalidatePath("/dashboard/schools");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateSchoolStatusAction(schoolId: string, status: 'approved' | 'rejected', adminEmail: string, schoolName: string) {
    try {
        const adminAppwrite = getAppwriteAdmin();

        // Update school status
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "schools", schoolId, { status });

        // Update admin profile if necessary
        if (status === 'approved') {
            const profiles = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", [
                Query.equal("email", adminEmail)
            ]);

            if (profiles.documents.length > 0) {
                const profile = profiles.documents[0];
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "profiles", profile.$id, {
                    status: 'approved',
                    role: 'school_admin',
                    school_id: schoolId
                });
            }
        } else if (status === 'rejected') {
            const profiles = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", [
                Query.equal("email", adminEmail)
            ]);

            if (profiles.documents.length > 0) {
                const profile = profiles.documents[0];
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "profiles", profile.$id, {
                    status: 'pending'
                });
            }
        }

        revalidatePath("/dashboard/schools");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function evaluateSubmissionAction(submissionId: string, score: number, feedback: string) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
        if (profile?.role !== "judge") {
            return { error: "Only assigned judges can perform evaluations." };
        }

        const adminAppwrite = getAppwriteAdmin();
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "submissions", submissionId, {
            score,
            feedback,
            status: 'reviewed'
        });

        revalidatePath("/dashboard/submissions");
        revalidatePath("/dashboard/evaluate");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteEventAction(id: string) {
    try {
        const adminAppwrite = getAppwriteAdmin();
        await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "events", id);
        revalidatePath("/dashboard/events");
        revalidatePath("/competitions");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
export async function getSubmissionForEditAction(submissionId: string) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const sub = await databases.getDocument(APPWRITE_DATABASE_ID, "submissions", submissionId);

        if (sub.student_id !== user.$id) {
            return { error: "Unauthorized access to this submission" };
        }

        if (sub.status !== 'pending') {
            return { error: "Only pending submissions can be edited" };
        }

        const videosRes = await databases.listDocuments(APPWRITE_DATABASE_ID, "submission_videos", [
            Query.equal("submission_id", submissionId)
        ]);

        return {
            success: true,
            submission: JSON.parse(JSON.stringify(sub)),
            video: videosRes.documents.length > 0 ? JSON.parse(JSON.stringify(videosRes.documents[0])) : null
        };
    } catch (e: any) {
        return { error: e.message || "Failed to fetch submission" };
    }
}
