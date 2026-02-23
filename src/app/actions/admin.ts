"use server";

import { createClient } from "@/lib/supabase/server";

import { createClient as createSupabaseClient } from '@supabase/supabase-js';


export async function createAdminUserAction(values: any) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
        return { error: "Insufficient permissions" };
    }

    // Use service role to create user natively
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Creates the user synchronously without affecting active session
    const { data: newAuthData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        user_metadata: {
            full_name: values.full_name,
            role: values.role,
            school_id: values.school_id,
            class_section: values.class_section
        },
        email_confirm: true
    });

    if (createError) return { error: createError.message };

    const newUserId = newAuthData?.user?.id;
    if (!newUserId) return { error: "Failed to gather identity" };

    if (values.role === 'teacher') {
        await adminSupabase.from("teachers").upsert({
            id: newUserId,
            class_section: values.class_section
        }, { onConflict: "id" });
    } else if (values.role === 'judge') {
        await adminSupabase.from("judges").upsert({
            id: newUserId,
            expertise: values.expertise,
            bio: values.bio
        }, { onConflict: "id" });
    }

    return { success: true, userId: newUserId };
}

export async function saveEventAction(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Missing Supabase Configuration: URL or Service Role Key is absent.");
        return { error: "Internal Server Configuration Error" };
    }

    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const { data: profile, error: profileError } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile || (profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
        console.error("Permission Check Failure:", profileError || "Insufficient Role");
        return { error: "Insufficient permissions to manage competitions." };
    }


    // Clean data object
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    let result;
    if (cleanData.id) {
        const { id, ...updateData } = cleanData;
        result = await adminSupabase.from("events").update(updateData).eq("id", id);
    } else {
        result = await adminSupabase.from("events").insert(cleanData);
    }

    if (result.error) {
        console.error("Supabase Save Error (Status):", result.status);
        console.error("Supabase Save Error (Data):", result.error);
        return { error: `Database Error: ${result.error.message}` };
    }
    return { success: true };
}

export async function sendBulkEventEmailAction(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) return { error: "Configuration Error" };

    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

    // 1. Get Event Details
    const { data: event } = await adminSupabase.from('events').select('title').eq('id', eventId).single();
    if (!event) return { error: "Event not found" };

    // 2. Get All School Admin Emails
    // We assume school admins are profiles with role 'school_admin'
    const { data: schoolAdmins, error: fetchError } = await adminSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('role', 'school_admin');

    if (fetchError) return { error: fetchError.message };

    // 3. Simulate sending emails
    console.log(`[BULK EMAIL] Initializing broadcast for: ${event.title}`);
    schoolAdmins.forEach(admin => {
        console.log(`[SIMULATED] Sending invitation to ${admin.full_name} (${admin.email}) for event: ${event.title}`);
    });

    return { success: true, count: schoolAdmins.length };
}
