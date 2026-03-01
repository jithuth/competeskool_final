"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

async function assertSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized", user: null, supabase };
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "super_admin") return { error: "Insufficient permissions", user: null, supabase };
    return { error: null, user, supabase };
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

    const adminSupabase = getAdminClient();

    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        user_metadata: { full_name: values.full_name, role: "judge" },
        email_confirm: true,
    });
    if (createError) return { error: createError.message };

    const uid = newUser.user.id;

    await adminSupabase.from("profiles").update({ role: "judge", status: "approved", full_name: values.full_name }).eq("id", uid);
    await adminSupabase.from("judges").upsert({ id: uid, expertise: values.expertise, bio: values.bio }, { onConflict: "id" });

    revalidatePath("/dashboard/judges");
    return { success: true };
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

    const adminSupabase = getAdminClient();

    await adminSupabase.from("profiles").update({ full_name: values.full_name, status: values.status }).eq("id", values.id);
    await adminSupabase.from("judges").upsert({ id: values.id, expertise: values.expertise, bio: values.bio }, { onConflict: "id" });

    revalidatePath("/dashboard/judges");
    return { success: true };
}

export async function deleteJudgeAction(judgeId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminSupabase = getAdminClient();
    const { error } = await adminSupabase.auth.admin.deleteUser(judgeId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/judges");
    return { success: true };
}

// ─────────────────────────────────────────────────────
// EVENT-JUDGE ASSIGNMENT
// ─────────────────────────────────────────────────────

export async function assignJudgeToEventAction(eventId: string, judgeId: string) {
    const { error: authError, user } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminSupabase = getAdminClient();
    const { error } = await adminSupabase.from("event_judges").upsert(
        { event_id: eventId, judge_id: judgeId, assigned_by: user!.id },
        { onConflict: "event_id,judge_id" }
    );
    if (error) return { error: error.message };

    revalidatePath("/dashboard/events");
    return { success: true };
}

export async function removeJudgeFromEventAction(eventId: string, judgeId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminSupabase = getAdminClient();
    const { error } = await adminSupabase.from("event_judges")
        .delete()
        .eq("event_id", eventId)
        .eq("judge_id", judgeId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/events");
    return { success: true };
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

    const adminSupabase = getAdminClient();

    // Delete existing criteria and re-insert (simplest approach for rubric builder)
    await adminSupabase.from("evaluation_criteria").delete().eq("event_id", eventId);
    const rows = criteria.map((c) => ({ ...c, event_id: eventId }));
    const { error } = await adminSupabase.from("evaluation_criteria").insert(rows);
    if (error) return { error: error.message };

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
}

// ─────────────────────────────────────────────────────
// JUDGE SCORING
// ─────────────────────────────────────────────────────

export async function saveScoresAction(submissionId: string, scores: {
    criterion_id: string;
    score: number;
    feedback: string;
}[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "judge" && profile?.role !== "super_admin") return { error: "Not a judge" };

    const adminSupabase = getAdminClient();

    // Check event scoring is not locked
    const { data: sub } = await adminSupabase.from("submissions").select("event_id").eq("id", submissionId).single();
    const { data: event } = await adminSupabase.from("events").select("results_status").eq("id", sub?.event_id).single();
    if (event?.results_status === "scoring_locked" || event?.results_status === "published") {
        return { error: "Scoring is locked for this event" };
    }

    const rows = scores.map((s) => ({
        submission_id: submissionId,
        judge_id: user.id,
        criterion_id: s.criterion_id,
        score: s.score,
        feedback: s.feedback,
        updated_at: new Date().toISOString(),
    }));

    const { error } = await adminSupabase
        .from("submission_scores")
        .upsert(rows, { onConflict: "submission_id,judge_id,criterion_id" });

    if (error) return { error: error.message };

    // Mark submission as reviewed
    await adminSupabase.from("submissions").update({ status: "reviewed" }).eq("id", submissionId);

    revalidatePath("/dashboard/evaluate");
    return { success: true };
}

// ─────────────────────────────────────────────────────
// SCORING LIFECYCLE (Super Admin)
// ─────────────────────────────────────────────────────

export async function updateEventResultsStatusAction(eventId: string, status: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminSupabase = getAdminClient();
    const { error } = await adminSupabase.from("events").update({ results_status: status }).eq("id", eventId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/events");
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
}

// ─────────────────────────────────────────────────────
// COMPUTE RESULTS (when scoring locked → review)
// ─────────────────────────────────────────────────────

export async function computeResultsAction(eventId: string) {
    const { error: authError } = await assertSuperAdmin();
    if (authError) return { error: authError };

    const adminSupabase = getAdminClient();

    // Fetch event config (public vote weight, default 20%)
    const { data: event } = await adminSupabase
        .from("events")
        .select("title, public_vote_weight")
        .eq("id", eventId)
        .single();

    const voteWeight = Math.min(Math.max(event?.public_vote_weight ?? 20, 0), 60) / 100; // cap at 60%
    const judgeWeight = 1 - voteWeight;

    // Fetch all criteria for the event
    const { data: criteria } = await adminSupabase
        .from("evaluation_criteria")
        .select("id, max_score, weight")
        .eq("event_id", eventId);

    if (!criteria || criteria.length === 0) return { error: "No rubric criteria found for this event" };

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    // Fetch all submissions for this event
    const { data: submissions } = await adminSupabase
        .from("submissions")
        .select("id, student_id, profiles!submissions_student_id_fkey(full_name, school_id, schools(name))")
        .eq("event_id", eventId);

    if (!submissions || submissions.length === 0) return { error: "No submissions found" };

    // Fetch all public vote counts for this event's submissions
    const subIds = submissions.map(s => s.id);
    const { data: allVotes } = await adminSupabase
        .from("submission_votes")
        .select("submission_id")
        .in("submission_id", subIds);

    const voteCountMap = new Map<string, number>();
    for (const v of allVotes || []) {
        voteCountMap.set(v.submission_id, (voteCountMap.get(v.submission_id) || 0) + 1);
    }
    const maxVotes = Math.max(...Array.from(voteCountMap.values()), 1); // normalise against max

    const results = [];

    for (const sub of submissions) {
        const { data: scores } = await adminSupabase
            .from("submission_scores")
            .select("criterion_id, score, judge_id")
            .eq("submission_id", sub.id);

        if (!scores || scores.length === 0) continue;

        // Average scores per criterion across judges
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

        // Judge weighted score (out of 100)
        let judgeScore = 0;
        let rawScore = 0;
        for (const c of criteria) {
            const avg = criterionAverages[c.id] || 0;
            rawScore += avg;
            judgeScore += (avg / c.max_score) * (c.weight / totalWeight) * 100;
        }

        // Public vote score (0–100 normalised)
        const votes = voteCountMap.get(sub.id) || 0;
        const publicVoteScore = (votes / maxVotes) * 100;

        // Blended final score
        const weightedScore = (judgeScore * judgeWeight) + (publicVoteScore * voteWeight);

        results.push({
            submission_id: sub.id,
            event_id: eventId,
            student_id: sub.student_id,
            raw_score: Math.round(rawScore * 100) / 100,
            weighted_score: Math.round(weightedScore * 100) / 100,
            public_vote_score: Math.round(publicVoteScore * 100) / 100,
            public_vote_count: votes,
            judge_count: judgeSet.size,
            computed_at: new Date().toISOString(),
        });
    }

    // Sort by weighted score descending to assign ranks
    results.sort((a, b) => b.weighted_score - a.weighted_score);
    const totalResultCount = results.length;

    const rankedResults = results.map((r, i) => {
        const rank = i + 1;
        const percentile = rank / totalResultCount;
        let tier = "participant";
        if (percentile <= 0.1) tier = "gold";
        else if (percentile <= 0.25) tier = "silver";
        else if (percentile <= 0.4) tier = "bronze";
        return { ...r, rank, tier };
    });

    // Upsert results
    const { error } = await adminSupabase
        .from("submission_results")
        .upsert(rankedResults, { onConflict: "submission_id" });

    if (error) return { error: error.message };

    // Lock scoring & move to review
    await adminSupabase.from("events").update({ results_status: "review" }).eq("id", eventId);

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true, count: rankedResults.length };
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

    const adminSupabase = getAdminClient();

    // Fetch event info
    const { data: event } = await adminSupabase
        .from("events")
        .select("title, results_status")
        .eq("id", eventId)
        .single();

    if (!event) return { error: "Event not found" };
    if (event.results_status !== "review") return { error: "Results must be computed before publishing" };

    // Fetch all computed results with student + school info
    const { data: results } = await adminSupabase
        .from("submission_results")
        .select(`
            id,
            submission_id,
            student_id,
            weighted_score,
            rank,
            tier,
            profiles!inner(full_name, school_id, schools(name))
        `)
        .eq("event_id", eventId);

    if (!results || results.length === 0) return { error: "No results computed for this event" };

    // Generate badges
    const badges = results.map((r: any) => {
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
        return {
            credential_id: credentialId,
            credential_hash: generateCredentialHash(hashPayload),
            submission_result_id: r.id,
            student_id: r.student_id,
            event_id: eventId,
            tier: r.tier,
            rank: r.rank,
            weighted_score: r.weighted_score,
            student_name: r.profiles?.full_name || "Unknown",
            school_name: (r.profiles as any)?.schools?.name || "Unknown School",
            event_name: event.title,
            issued_by: "CompeteEdu",
            issued_at: new Date().toISOString(),
            is_public: r.tier !== "participant", // Only non-participant badges shown in gallery
        };
    });

    const { error: badgeError } = await adminSupabase.from("badges").upsert(badges, { onConflict: "credential_id" });
    if (badgeError) return { error: badgeError.message };

    // Publish the event results
    await adminSupabase.from("events").update({
        results_status: "published",
        results_published_at: new Date().toISOString(),
    }).eq("id", eventId);

    revalidatePath("/", "layout");
    revalidatePath(`/events/${eventId}/results`);
    revalidatePath("/winners");
    revalidatePath("/dashboard");
    return { success: true, badgeCount: badges.length };
}
