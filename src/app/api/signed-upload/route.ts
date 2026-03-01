/**
 * GET /api/signed-upload?filename=xyz.mp4&contentType=video/mp4
 *
 * Generates a Supabase signed upload URL using the admin client.
 * The client then XHR-POSTs the file DIRECTLY to Supabase (not through Next.js),
 * giving real upload progress events and bypassing all size limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function adminSupabase() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(req: NextRequest) {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename") || "upload";
    const contentType = searchParams.get("contentType") || "application/octet-stream";

    const ext = filename.split(".").pop()?.toLowerCase() || "bin";
    const storagePath = `${user.id}/${randomUUID()}.${ext}`;

    // Generate a signed URL using the admin client
    // This bypasses RLS entirely and uses the service-role key.
    const supa = adminSupabase();
    const { data, error } = await supa.storage
        .from("submissions")
        .createSignedUploadUrl(storagePath);

    if (error || !data) {
        return NextResponse.json({ error: error?.message || "Could not create signed URL" }, { status: 500 });
    }

    return NextResponse.json({
        signedUrl: data.signedUrl,
        token: data.token,
        path: storagePath,
        // Clients need the public URL after upload completes
        publicUrl: supa.storage.from("submissions").getPublicUrl(storagePath).data.publicUrl,
    });
}
