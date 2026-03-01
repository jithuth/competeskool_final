/**
 * POST /api/youtube-upload-chunk
 *
 * Proxies a single chunk of a YouTube resumable upload.
 * Each chunk is ≤ 8 MB so req.arrayBuffer() is always within Next.js's
 * dev-mode body limit. The client calls this repeatedly until YouTube
 * returns 200/201 (upload complete).
 *
 * Required headers from client:
 *   x-upload-url      — the resumable upload URI from /api/youtube-upload-init
 *   x-content-range   — e.g. "bytes 0-8388607/52428800"
 *   Content-Type      — video/mp4 (or original mime type)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Get required headers
    const uploadUrl = req.headers.get("x-upload-url");
    const contentRange = req.headers.get("x-content-range");
    const contentType = req.headers.get("content-type") || "video/mp4";

    if (!uploadUrl || !contentRange) {
        return NextResponse.json({ error: "x-upload-url and x-content-range headers are required" }, { status: 400 });
    }

    // 3. Read the chunk (<= 8 MB — safely within Turbopack's body limit)
    let chunk: ArrayBuffer;
    try {
        chunk = await req.arrayBuffer();
    } catch (err: any) {
        return NextResponse.json({ error: "Failed to read chunk: " + err.message }, { status: 400 });
    }

    if (!chunk || chunk.byteLength === 0) {
        return NextResponse.json({ error: "Empty chunk" }, { status: 400 });
    }

    // 4. Forward chunk to YouTube
    const ytRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": contentType,
            "Content-Range": contentRange,
            "Content-Length": chunk.byteLength.toString(),
        },
        body: chunk,
    });

    // 200 or 201 = upload complete, YouTube returns the video object
    if (ytRes.status === 200 || ytRes.status === 201) {
        const data = await ytRes.json();
        const videoId = data.id;
        return NextResponse.json({
            done: true,
            videoId,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
        });
    }

    // 308 Resume Incomplete = more chunks needed
    if (ytRes.status === 308) {
        const range = ytRes.headers.get("range"); // e.g. "bytes=0-8388607"
        return NextResponse.json({ done: false, range });
    }

    // Any other status = error
    const errText = await ytRes.text().catch(() => ytRes.status.toString());
    console.error("[youtube-upload-chunk] YouTube error:", ytRes.status, errText);
    return NextResponse.json({ error: `YouTube chunk upload failed (${ytRes.status})` }, { status: 500 });
}
