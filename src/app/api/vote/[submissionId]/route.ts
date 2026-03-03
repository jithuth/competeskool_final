import { getAppwriteAdmin, APPWRITE_DATABASE_ID } from "@/lib/appwrite/server";
import { Query, ID } from "node-appwrite";
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

    const { databases } = getAppwriteAdmin();

    try {
        // 1. Check submission exists
        const sub = await databases.getDocument(APPWRITE_DATABASE_ID, "submissions", submissionId);
        if (!sub) return Response.json({ error: "Submission not found" }, { status: 404 });

        // 2. Check event status
        const event = await databases.getDocument(APPWRITE_DATABASE_ID, "events", sub.event_id);
        if (["scoring_locked", "review", "published"].includes(event?.results_status)) {
            return Response.json({ error: "Voting is closed for this event" }, { status: 403 });
        }

        // 3. Check if already voted (duplicate prevention)
        const existing = await databases.listDocuments(APPWRITE_DATABASE_ID, "submission_votes", [
            Query.equal("submission_id", submissionId),
            Query.equal("voter_ip", voterIp),
            Query.limit(1)
        ]);

        if (existing.total > 0) {
            return Response.json({ error: "Already voted", alreadyVoted: true }, { status: 409 });
        }

        // 4. Create vote
        await databases.createDocument(APPWRITE_DATABASE_ID, "submission_votes", ID.unique(), {
            submission_id: submissionId,
            voter_ip: voterIp
        });

        // 5. Get updated count
        const allVotes = await databases.listDocuments(APPWRITE_DATABASE_ID, "submission_votes", [
            Query.equal("submission_id", submissionId),
            Query.limit(1)
        ]);

        return Response.json({ success: true, voteCount: allVotes.total });
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    const { submissionId } = await params;
    const { databases } = getAppwriteAdmin();

    try {
        const votes = await databases.listDocuments(APPWRITE_DATABASE_ID, "submission_votes", [
            Query.equal("submission_id", submissionId),
            Query.limit(1)
        ]);

        return Response.json({ voteCount: votes.total || 0 });
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
