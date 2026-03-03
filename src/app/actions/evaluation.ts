"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";
import crypto from "crypto";

async function assertSuperAdmin() {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized", user: null };
        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
        if (profile?.role !== "super_admin") return { error: "Insufficient permissions", user: null };
        return { error: null, user };
    } catch (e: any) {
        return { error: e.message || "Unauthorized", user: null };
    }
}

// ─────────────────────────────────────────────────────
// JUDGE MANAGEMENT
// ─────────────────────────────────────────────────────

export async function createJudgeAction(values: {
    full_name: string;
    email: string;
    password: string;
    expertise: string;
    bio: string;
}) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();

    try {
        const uid = ID.unique();
        const newUser = await adminAppwrite.users.create(
            uid,
            values.email,
            undefined,
            values.password,
            values.full_name
        );

        try {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "profiles", newUser.$id, {
                role: "judge", status: "approved", full_name: values.full_name, email: values.email
            });
        } catch (e) { }

        await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "judges", newUser.$id, {
            expertise: values.expertise, bio: values.bio
        });

        revalidatePath("/dashboard/judges");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateJudgeAction(values: {
    id: string;
    full_name: string;
    expertise: string;
    bio: string;
    status: string;
}) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();

    try {
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "profiles", values.id, {
            full_name: values.full_name, status: values.status
        });
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "judges", values.id, {
            expertise: values.expertise, bio: values.bio
        });
        revalidatePath("/dashboard/judges");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteJudgeAction(judgeId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();
    try {
        await adminAppwrite.users.delete(judgeId);
        revalidatePath("/dashboard/judges");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// EVENT-JUDGE ASSIGNMENT
// ─────────────────────────────────────────────────────

export async function assignJudgeToEventAction(eventId: string, judgeId: string) {
    const { error: authError, user } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();
    try {
        // Since event_id and judge_id pair needs to be unique, we first check if it exists
        const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "event_judges", [
            Query.equal("event_id", eventId),
            Query.equal("judge_id", judgeId),
            Query.limit(1)
        ]);

        if (existing.documents.length === 0) {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "event_judges", ID.unique(), {
                event_id: eventId, judge_id: judgeId, assigned_by: user!.$id
            });
        }
        revalidatePath("/dashboard/events");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function removeJudgeFromEventAction(eventId: string, judgeId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();
    try {
        const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "event_judges", [
            Query.equal("event_id", eventId),
            Query.equal("judge_id", judgeId)
        ]);
        for (const doc of existing.documents) {
            await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "event_judges", doc.$id);
        }
        revalidatePath("/dashboard/events");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// RUBRIC / EVALUATION CRITERIA
// ─────────────────────────────────────────────────────

export async function saveRubricAction(eventId: string, criteria: {
    id?: string;
    title: string;
    description: string;
    max_score: number;
    weight: number;
    display_order: number;
}[]) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();

    try {
        // Delete existing criteria and re-insert
        const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "evaluation_criteria", [
            Query.equal("event_id", eventId)
        ]);
        for (const doc of existing.documents) {
            await adminAppwrite.databases.deleteDocument(APPWRITE_DATABASE_ID, "evaluation_criteria", doc.$id);
        }

        for (const c of criteria) {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "evaluation_criteria", ID.unique(), {
                event_id: eventId,
                title: c.title,
                description: c.description,
                max_score: c.max_score,
                weight: c.weight,
                display_order: c.display_order
            });
        }

        revalidatePath(`/dashboard/events/${eventId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// JUDGE SCORING
// ─────────────────────────────────────────────────────

export async function saveScoresAction(submissionId: string, scores: {
    criterion_id: string;
    score: number;
    feedback: string;
}[]) {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();
        if (!user) return { error: "Unauthorized" };

        const profile = await databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
        if (profile?.role !== "judge") return { error: "Only assigned judges can perform evaluations." };

        const adminAppwrite = getAppwriteAdmin();

        // Check event scoring is not locked
        const sub = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "submissions", submissionId);
        const event = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "events", sub.event_id);

        if (event?.status === "scoring_locked" || event?.status === "published") {
            return { error: "Scoring is locked for this event" };
        }

        for (const s of scores) {
            const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_scores", [
                Query.equal("submission_id", submissionId),
                Query.equal("judge_id", user.$id),
                Query.equal("criterion_id", s.criterion_id)
            ]);

            const payload = {
                submission_id: submissionId,
                judge_id: user.$id,
                criterion_id: s.criterion_id,
                score: s.score,
                feedback: s.feedback,
            };

            if (existing.documents.length > 0) {
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "submission_scores", existing.documents[0].$id, payload);
            } else {
                await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "submission_scores", ID.unique(), payload);
            }
        }

        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "submissions", submissionId, { status: "reviewed" });

        revalidatePath("/dashboard/evaluate");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// SCORING LIFECYCLE (Super Admin)
// ─────────────────────────────────────────────────────

export async function updateEventResultsStatusAction(eventId: string, status: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();
    try {
        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "events", eventId, { results_status: status });
        revalidatePath("/dashboard/events");
        revalidatePath(`/dashboard/events/${eventId}`);
        revalidatePath(`/dashboard/events/${eventId}/scoring`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// COMPUTE RESULTS
// ─────────────────────────────────────────────────────

export async function computeResultsAction(eventId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();

    try {
        const event = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "events", eventId);
        // Supabase `public_vote_weight` might not exist in Appwrite setup unless added. Defaulting to 20.
        const voteWeight = 0.2;
        const judgeWeight = 0.8;

        const criteriaRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "evaluation_criteria", [
            Query.equal("event_id", eventId)
        ]);
        const criteria = criteriaRes.documents;
        if (!criteria || criteria.length === 0) return { error: "No rubric criteria found for this event" };

        const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

        const submissionsRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submissions", [
            Query.equal("event_id", eventId)
        ]);
        const submissions = submissionsRes.documents;
        if (!submissions || submissions.length === 0) return { error: "No submissions found" };

        // We fetch public votes here (if collection exists)
        // Ignoring public votes scale logic due to Appwrite schema missing submission_votes
        const maxVotes = 1;

        const results: any[] = [];

        for (const sub of submissions) {
            const scoresRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_scores", [
                Query.equal("submission_id", sub.$id)
            ]);
            const scores = scoresRes.documents;
            if (!scores || scores.length === 0) continue;

            const criterionAverages: Record<string, number> = {};
            const judgeSet = new Set<string>();

            for (const s of scores) {
                judgeSet.add(s.judge_id);
                if (!criterionAverages[s.criterion_id]) criterionAverages[s.criterion_id] = 0;
                criterionAverages[s.criterion_id] += s.score;
            }

            const judgeCountPerCriteria: Record<string, number> = {};
            for (const s of scores) {
                judgeCountPerCriteria[s.criterion_id] = (judgeCountPerCriteria[s.criterion_id] || 0) + 1;
            }
            for (const cid in criterionAverages) {
                criterionAverages[cid] /= (judgeCountPerCriteria[cid] || 1);
            }

            let judgeScore = 0;
            let rawScore = 0;
            for (const c of criteria) {
                const avg = criterionAverages[c.$id] || 0;
                rawScore += avg;
                judgeScore += (avg / (c.max_score || 10)) * ((c.weight || 0) / totalWeight) * 100;
            }

            const publicVoteScore = 0;
            const weightedScore = (judgeScore * judgeWeight) + (publicVoteScore * voteWeight);

            results.push({
                submission_id: sub.$id,
                event_id: eventId,
                student_id: sub.student_id,
                raw_score: Math.round(rawScore * 100) / 100,
                weighted_score: Math.round(weightedScore * 100) / 100,
                public_vote_score: 0,
                public_vote_count: 0,
                judge_count: judgeSet.size,
                computed_at: new Date().toISOString(),
            });
        }

        results.sort((a, b) => b.weighted_score - a.weighted_score);
        const totalResultCount = results.length;

        const rankedResults = results.map((r, i) => {
            const rank = i + 1;
            const percentile = rank / totalResultCount;
            let tier = "participant";
            if (percentile <= 0.1) tier = "gold";
            else if (percentile <= 0.25) tier = "silver";
            else if (percentile <= 0.4) tier = "bronze";
            return { ...r, rank, tier, is_icon: rank === 1, icon_approved: false };
        });

        for (const item of rankedResults) {
            const existing = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_results", [
                Query.equal("submission_id", item.submission_id)
            ]);
            if (existing.documents.length > 0) {
                await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "submission_results", existing.documents[0].$id, item);
            } else {
                await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "submission_results", ID.unique(), item);
            }
        }

        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "events", eventId, { results_status: "review" });

        revalidatePath(`/dashboard/events/${eventId}`);
        return { success: true, count: rankedResults.length };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// PUBLISH RESULTS + AUTO-GENERATE BADGES
// ─────────────────────────────────────────────────────

function generateCredentialId(): string {
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `CE-${year}-${random}`;
}

function generateCredentialHash(data: object): string {
    const secret = process.env.BADGE_SECRET || "competeedu-secret-2026";
    const payload = JSON.stringify(data) + secret;
    return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function publishResultsAction(eventId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();

    try {
        const event = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "events", eventId);
        if (!event) return { error: "Event not found" };
        if (event.results_status !== "review") return { error: "Results must be computed before publishing" };

        const resultsRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_results", [
            Query.equal("event_id", eventId)
        ]);
        const results = resultsRes.documents;
        if (!results || results.length === 0) return { error: "No results computed for this event" };

        const badges: any[] = [];

        for (const r of results) {
            let studentName = "Unknown";
            let schoolName = "Unknown School";

            try {
                const profile = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", r.student_id);
                studentName = profile.full_name || "Unknown";
                if (profile.school_id) {
                    const school = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "schools", profile.school_id);
                    schoolName = school.name || "Unknown School";
                }
            } catch (e) { }

            const credentialId = generateCredentialId();
            const hashPayload = {
                credential_id: credentialId,
                student_id: r.student_id,
                event_id: eventId,
                tier: r.tier,
                rank: r.rank,
                weighted_score: r.weighted_score,
                issued_at: new Date().toISOString(),
            };
            badges.push({
                credential_id: credentialId,
                credential_hash: generateCredentialHash(hashPayload),
                submission_result_id: r.$id,
                student_id: r.student_id,
                event_id: eventId,
                tier: r.tier,
                rank: r.rank,
                weighted_score: r.weighted_score,
                student_name: studentName,
                school_name: schoolName,
                event_name: event.title,
                issued_by: "CompeteEdu",
                issued_at: new Date().toISOString(),
                is_public: r.tier !== "participant",
            });
        }

        for (const item of badges) {
            await adminAppwrite.databases.createDocument(APPWRITE_DATABASE_ID, "badges", ID.unique(), item);
        }

        await adminAppwrite.databases.updateDocument(APPWRITE_DATABASE_ID, "events", eventId, {
            results_status: "published",
        });

        revalidatePath("/", "layout");
        revalidatePath(`/events/${eventId}/results`);
        revalidatePath("/winners");
        revalidatePath("/dashboard");
        return { success: true, badgeCount: badges.length };
    } catch (e: any) {
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// EVENT ICON APPROVAL
// ─────────────────────────────────────────────────────

export async function approveEventIconAction(eventId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();
    try {
        const resultsRes = await adminAppwrite.databases.listDocuments(
            APPWRITE_DATABASE_ID, "submission_results", [
            Query.equal("event_id", eventId),
            Query.equal("is_icon", true),
            Query.limit(1),
        ]
        );
        if (resultsRes.documents.length === 0)
            return { error: "No icon candidate found — run Compute Results first" };

        await adminAppwrite.databases.updateDocument(
            APPWRITE_DATABASE_ID, "submission_results",
            resultsRes.documents[0].$id,
            { icon_approved: true }
        );

        revalidatePath(`/dashboard/events/${eventId}/scoring`);
        revalidatePath(`/events/${eventId}/results`);
        return { success: true, student_id: resultsRes.documents[0].student_id };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function revokeEventIconAction(eventId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminAppwrite = getAppwriteAdmin();
    try {
        const resultsRes = await adminAppwrite.databases.listDocuments(
            APPWRITE_DATABASE_ID, "submission_results", [
            Query.equal("event_id", eventId),
            Query.equal("is_icon", true),
            Query.limit(1),
        ]
        );
        if (resultsRes.documents.length === 0) return { error: "No icon found" };

        await adminAppwrite.databases.updateDocument(
            APPWRITE_DATABASE_ID, "submission_results",
            resultsRes.documents[0].$id,
            { icon_approved: false }
        );

        revalidatePath(`/dashboard/events/${eventId}/scoring`);
        revalidatePath(`/events/${eventId}/results`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
