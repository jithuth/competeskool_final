import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

function hashIp(ip: string) {
    return crypto.createHash("sha256").update(ip + (process.env.BADGE_SECRET || "vote-salt")).digest("hex");
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    const { submissionId } = await params;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        || "unknown";
    const voterIp = hashIp(ip);

    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check submission exists and event is still accepting votes (not yet locked)
    const { data: sub } = await supabase
        .from("submissions")
        .select("id, event_id, events!submissions_event_id_fkey(results_status, end_date)")
        .eq("id", submissionId)
        .single();

    if (!sub) return Response.json({ error: "Submission not found" }, { status: 404 });

    const event = (sub as any).events;
    // Voting allowed only when results are not published yet (up to scoring_open)
    if (["scoring_locked", "review", "published"].includes(event?.results_status)) {
        return Response.json({ error: "Voting is closed for this event" }, { status: 403 });
    }

    // Upsert vote — unique(submission_id, voter_ip) handles duplicate prevention
    const { error } = await supabase
        .from("submission_votes")
        .upsert({ submission_id: submissionId, voter_ip: voterIp }, { onConflict: "submission_id,voter_ip" });

    if (error) {
        // 23505 = unique violation = already voted
        if (error.code === "23505") {
            return Response.json({ error: "Already voted", alreadyVoted: true }, { status: 409 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }

    // Return updated vote count
    const { count } = await supabase
        .from("submission_votes")
        .select("*", { count: "exact", head: true })
        .eq("submission_id", submissionId);

    return Response.json({ success: true, voteCount: count });
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    const { submissionId } = await params;
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count } = await supabase
        .from("submission_votes")
        .select("*", { count: "exact", head: true })
        .eq("submission_id", submissionId);

    return Response.json({ voteCount: count || 0 });
}
