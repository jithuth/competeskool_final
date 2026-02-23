"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createNotificationAction(data: {
    title: string;
    message: string;
    type: string;
    recipient_role: string;
    event_id: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) return { error: "Configuration Error" };

    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

    const { error } = await adminSupabase.from('notifications').insert({
        ...data,
        sender_id: user.id
    });

    if (error) {
        console.error("Notification Error:", error);
        return { error: error.message };
    }

    return { success: true };
}

export async function getNotificationsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile) return [];

    const { data: notifications } = await supabase
        .from('notifications')
        .select('*, events(title)')
        .eq('recipient_role', profile.role)
        .order('created_at', { ascending: false });

    return notifications || [];
}
