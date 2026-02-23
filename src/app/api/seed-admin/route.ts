import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
    console.log("Seeding admin...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase credentials");
        return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const adminEmail = "admin1@admin.com";
    const adminPassword = "password123"; // USER: Change this immediately after login

    // 1. Create the user in Auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
            full_name: "Super Admin",
            role: "super_admin"
        }
    });

    if (authError) {
        if (authError.message.includes("already registered")) {
            return NextResponse.json({ message: "Admin user already exists." });
        }
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // The 'handle_new_user' trigger in SQL should automatically create the profile.
    // We just need to ensure the status is 'approved' (the trigger logic already does this for super_admin).

    return NextResponse.json({
        message: "Admin user seeded successfully!",
        credentials: {
            email: adminEmail,
            password: adminPassword
        }
    });
}
