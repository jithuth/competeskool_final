"use server";

import { createClient } from "@/lib/supabase/server";

export async function loginAction(values: any) {
    try {
        const supabase = await createClient();
        console.log("LOGIN ACTION TRIGGERED for email:", values.email);

        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password
        });

        if (error) {
            console.log("LOGIN FAILED:", error.message);
            return { error: error.message };
        }

        // We also want to check if the user status is pending/rejected, but
        // since we are using Supabase auth now, the profile creation is handled separately.
        // Let's grab the profile to check status.
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).single();
            if (profile && (profile.status === 'pending' || profile.status === 'rejected')) {
                await supabase.auth.signOut();
                return { error: `Account is ${profile.status}. Contact administrator.` };
            }
        }

        console.log("LOGIN SUCCESS: Session created");
        return { success: true };
    } catch (err: any) {
        console.error("LOGIN CRASH:", err);
        return { error: err.message || "An unexpected error occurred." };
    }
}

export async function registerAction(values: any) {
    try {
        const supabase = await createClient();

        // Register the user with Supabase Auth
        const { data: sessionData, error: signUpError } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
                data: {
                    full_name: values.full_name,
                    role: "student",
                    school_id: values.school_id,
                }
            }
        });

        if (signUpError) {
            return { error: signUpError.message };
        }

        const user = sessionData.user;
        if (!user) return { error: "User creation failed" };

        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: studentError } = await adminSupabase
            .from("students")
            .upsert({
                id: user.id,
                phone: values.phone,
                father_name: values.father_name,
                mother_name: values.mother_name,
                grade_level: values.grade_level,
                teacher_id: values.teacher_id,
            });

        if (studentError) {
            console.error("Profile created but details failed:", studentError.message);
        }

        await supabase.auth.signOut();

        return { success: true };
    } catch (err: any) {
        return { error: err.message || "An unexpected error occurred during registration." };
    }
}

export async function registerSchoolAction(values: any) {
    try {
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Insert School
        const { data: school, error: schoolError } = await adminSupabase
            .from("schools")
            .insert({
                name: values.school_name,
                address: values.school_address,
                admin_email: values.admin_email,
                status: 'pending'
            })
            .select()
            .single();

        if (schoolError) return { error: `School creation failed: ${schoolError.message}` };

        // Create Admin user natively
        const { data: newAuthData, error: signUpError } = await adminSupabase.auth.admin.createUser({
            email: values.admin_email,
            password: values.admin_password,
            user_metadata: {
                full_name: values.admin_name,
                role: 'school_admin',
                school_id: school.id,
            },
            email_confirm: true
        });

        if (signUpError) {
            await adminSupabase.from("schools").delete().eq("id", school.id);
            return { error: `Admin registration failed: ${signUpError.message}` };
        }

        return { success: true };
    } catch (err: any) {
        return { error: err.message || "An unexpected error occurred." };
    }
}

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
}
