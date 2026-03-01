/**
 * POST /api/youtube-upload-init
 *
 * Initiates a YouTube resumable upload session using the platform OAuth token.
 * Returns an authenticated `uploadUrl` — the client then XHR-PUTs the raw file
 * directly to YouTube (no Next.js body limit, real upload progress, no Supabase).
 *
 * YouTube re-encodes all uploads anyway, so no ffmpeg compression is needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    // 1. Auth — only logged-in users can initiate uploads
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Check YouTube is configured
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
        return NextResponse.json({ error: "YouTube not configured on this server" }, { status: 503 });
    }

    // 3. Parse request — tiny JSON body, no size issues
    const { title, description, fileSize, contentType } = await req.json();

    if (!fileSize || !contentType) {
        return NextResponse.json({ error: "fileSize and contentType are required" }, { status: 400 });
    }

    // 4. Get a fresh access token using the stored refresh token
    const auth = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
    );
    auth.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });

    let accessToken: string | null | undefined;
    try {
        const tokenResponse = await auth.getAccessToken();
        accessToken = tokenResponse.token;
    } catch (err: any) {
        return NextResponse.json(
            { error: `Failed to refresh YouTube token: ${err.message}` },
            { status: 500 }
        );
    }

    if (!accessToken) {
        return NextResponse.json({ error: "Could not obtain YouTube access token" }, { status: 500 });
    }

    const privacy = (process.env.YOUTUBE_PRIVACY || "unlisted") as string;
    const videoTitle = (title || "Student Submission").slice(0, 100);

    // 5. Initiate YouTube resumable upload session
    //    This is a lightweight metadata-only request — no file bytes here.
    const ytResponse = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json; charset=UTF-8",
                "X-Upload-Content-Type": contentType,
                "X-Upload-Content-Length": String(fileSize),
            },
            body: JSON.stringify({
                snippet: {
                    title: videoTitle,
                    description: (description || "").slice(0, 5000),
                    categoryId: "27",   // Education
                    tags: ["compete", "student", "competition"],
                },
                status: {
                    privacyStatus: privacy,
                    selfDeclaredMadeForKids: false,
                },
            }),
        }
    );

    if (!ytResponse.ok) {
        const errText = await ytResponse.text();
        console.error("[youtube-upload-init] YouTube API error:", errText);
        return NextResponse.json(
            { error: `YouTube rejected the upload request: ${ytResponse.status}` },
            { status: 500 }
        );
    }

    // 6. The resumable upload URL is in the Location header
    const uploadUrl = ytResponse.headers.get("location");
    if (!uploadUrl) {
        return NextResponse.json({ error: "YouTube did not return an upload URL" }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl });
}
