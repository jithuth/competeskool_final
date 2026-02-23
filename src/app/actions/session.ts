"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, school_id")
        .eq("id", user.id)
        .single();

    return {
        userId: user.id,
        role: profile?.role,
        school_id: profile?.school_id
    };
}
