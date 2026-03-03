"use server";

import { createSessionClient, createAdminClient, SESSION_COOKIE, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { cookies } from "next/headers";
import { ID } from "node-appwrite";

export async function loginAction(values: any) {
    try {
        console.log("LOGIN ACTION TRIGGERED for email:", values.email);
        const { account, databases } = await createAdminClient();

        // 1. Create session via Email Password
        const session = await account.createEmailPasswordSession(values.email, values.password);

        if (!session || !session.secret) {
            return { error: "Failed to establish a secure session." };
        }

        // 2. Fetch the corresponding user Profile to check approval status
        try {
            const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", session.userId);
            if (profile && (profile.status === 'pending' || profile.status === 'rejected')) {
                // Instantly delete the session we just made
                await account.deleteSession(session.$id);
                return { error: `Account is ${profile.status}. Contact administrator.` };
            }
        } catch (docErr: any) {
            console.log("Profile not found during login check:", docErr.message);
        }

        // 3. Set the encrypted Next.js Cookie to store the Appwrite session
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            expires: new Date(session.expire),
        });

        console.log("LOGIN SUCCESS: Session cookie planted.");
        return { success: true };
    } catch (err: any) {
        console.error("LOGIN CRASH:", err);
        return { error: err.message || "An unexpected error occurred during login." };
    }
}

export async function registerAction(values: any) {
    try {
        const { account, databases } = await createAdminClient();

        // 1. Verify Teacher and School match strictly before proceeding
        if (values.teacher_id && values.school_id) {
            try {
                const teacherProfile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", values.teacher_id);
                if (!teacherProfile) {
                    return { error: "The selected teacher could not be found." };
                }
                if (teacherProfile.school_id !== values.school_id) {
                    return { error: "Security Mismatch: The selected teacher does not belong to the selected school." };
                }
            } catch (err: any) {
                if (err.code === 404) return { error: "The selected teacher could not be found." };
                throw err;
            }
        }

        // 2. Register User dynamically
        const newUserId = ID.unique();
        const user = await account.create(
            newUserId,
            values.email,
            values.password,
            values.full_name
        );

        // 3. Insert Student Profile Database Document matching user.id
        await databases.createDocument(APPWRITE_DATABASE_ID, "profiles", user.$id, {
            email: values.email,
            full_name: values.full_name,
            role: "student",
            school_id: values.school_id,
            status: "pending",
            created_at: new Date().toISOString()
        });

        // 4. Insert Student Details Database Document
        await databases.createDocument(APPWRITE_DATABASE_ID, "students", user.$id, {
            phone: values.phone,
            father_name: values.father_name,
            mother_name: values.mother_name,
            grade_level: values.grade_level,
            teacher_id: values.teacher_id,
        });

        return { success: true };
    } catch (err: any) {
        return { error: err.message || "An unexpected error occurred during registration." };
    }
}

export async function registerSchoolAction(values: any) {
    try {
        const { account, databases } = await createAdminClient();

        // 1. Insert School Reference Document
        const schoolDocType = await databases.createDocument(APPWRITE_DATABASE_ID, "schools", ID.unique(), {
            name: values.school_name,
            address: values.school_address,
            admin_email: values.admin_email,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        // 2. Register Admin User Profile 
        const adminUser = await account.create(
            ID.unique(),
            values.admin_email,
            values.admin_password,
            values.admin_name
        );

        // 3. Create Profile Mapping
        await databases.createDocument(APPWRITE_DATABASE_ID, "profiles", adminUser.$id, {
            email: values.admin_email,
            full_name: values.admin_name,
            role: "school_admin",
            school_id: schoolDocType.$id,
            status: "pending", // Waiting for Super Admin approval
            created_at: new Date().toISOString()
        });

        return { success: true };
    } catch (err: any) {
        return { error: err.message || "An unexpected error occurred." };
    }
}

export async function logoutAction() {
    try {
        const { account } = await createSessionClient();
        await account.deleteSession("current");

        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE);
        return { success: true };
    } catch (err) {
        // Just clear the underlying cookie anyway if Appwrite errors
        console.error("Logout issue:", err);
        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE);
        return { success: true };
    }
}

export async function updateSelfProfileAction(values: {
    full_name?: string,
    class_section?: string,
    grade_level?: string,
    phone?: string,
    father_name?: string,
    mother_name?: string
}) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);

        // 1. Update Profile (Base)
        if (values.full_name) {
            await databases.updateDocument(APPWRITE_DATABASE_ID, "profiles", user.$id, {
                full_name: values.full_name
            });
        }

        // 2. Update Role Specific Details
        if (profile.role === 'teacher' && values.class_section) {
            await databases.updateDocument(APPWRITE_DATABASE_ID, "teachers", user.$id, {
                class_section: values.class_section
            });
        }

        if (profile.role === 'student') {
            const studentData: any = {};
            if (values.grade_level) studentData.grade_level = values.grade_level;
            if (values.phone) studentData.phone = values.phone;
            if (values.father_name) studentData.father_name = values.father_name;
            if (values.mother_name) studentData.mother_name = values.mother_name;

            if (Object.keys(studentData).length > 0) {
                await databases.updateDocument(APPWRITE_DATABASE_ID, "students", user.$id, studentData);
            }
        }

        return { success: true };
    } catch (err: any) {
        return { error: err.message || "Failed to update profile." };
    }
}

export async function updatePasswordAction(password: string) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        await account.updatePassword(password);
        return { success: true };
    } catch (err: any) {
        return { error: err.message || "Failed to update password." };
    }
}
