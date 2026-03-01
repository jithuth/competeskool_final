import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function GET() {
    // Auth guard — super admin only
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        return NextResponse.json({
            configured: false,
            missing: [
                !clientId && "YOUTUBE_CLIENT_ID",
                !clientSecret && "YOUTUBE_CLIENT_SECRET",
                !refreshToken && "YOUTUBE_REFRESH_TOKEN",
            ].filter(Boolean),
        });
    }

    // Try to fetch the channel info — proves auth works without uploading anything
    try {
        const auth = new google.auth.OAuth2(clientId, clientSecret);
        auth.setCredentials({ refresh_token: refreshToken });

        const youtube = google.youtube({ version: "v3", auth });
        const res = await youtube.channels.list({ part: ["snippet"], mine: true });

        const channel = res.data.items?.[0];
        return NextResponse.json({
            configured: true,
            channel: channel
                ? { id: channel.id, title: channel.snippet?.title, url: `https://youtube.com/channel/${channel.id}` }
                : null,
            privacy: process.env.YOUTUBE_PRIVACY || "unlisted",
        });
    } catch (err: any) {
        return NextResponse.json({ configured: true, error: err.message }, { status: 500 });
    }
}
