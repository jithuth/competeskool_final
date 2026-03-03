import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { redirect, notFound } from "next/navigation";
import { RubricBuilder } from "@/components/dashboard/evaluate/RubricBuilder";
import { ScoringMonitor } from "@/components/dashboard/evaluate/ScoringMonitor";
import { EventIconPanel } from "@/components/dashboard/evaluate/EventIconPanel";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Users, BarChart3, Trophy, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Query } from "node-appwrite";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    not_started: { label: "Not Started", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
    scoring_open: { label: "Scoring Open", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500 animate-pulse" },
    scoring_locked: { label: "Scoring Locked", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    review: { label: "Under Review", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
    published: { label: "Results Published", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

export default async function EventScoringPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params;

    let user;
    try {
        const { account } = await createSessionClient();
        user = await account.get();
    } catch (e) {
        redirect("/login");
    }
    if (!user) redirect("/login");

    const adminAppwrite = getAppwriteAdmin();

    let profile: any = null;
    try {
        profile = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
    } catch (e) { }
    if (profile?.role !== "super_admin") redirect("/dashboard");

    // ── Event ──────────────────────────────────────
    let event: any = null;
    try {
        const raw = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "events", eventId);
        event = JSON.parse(JSON.stringify(raw));
    } catch (e) { notFound(); }
    if (!event) notFound();

    // ── Evaluation Criteria ────────────────────────
    let criteria: any[] = [];
    try {
        const r = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "evaluation_criteria", [
            Query.equal("event_id", eventId),
            Query.orderAsc("display_order"),
        ]);
        criteria = JSON.parse(JSON.stringify(r.documents));
    } catch (e) { }

    // ── All judges in the system ───────────────────
    let allJudges: any[] = [];
    try {
        const judgesRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", [
            Query.equal("role", "judge"),
        ]);
        const rawList = await Promise.all(
            judgesRes.documents.map(async (doc: any) => {
                let expertise = "";
                try {
                    const jRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "judges", [
                        Query.equal("profile_id", doc.$id),
                    ]);
                    expertise = jRes.documents[0]?.expertise || "";
                } catch (e) { }
                return { id: doc.$id, full_name: doc.full_name || "", email: doc.email || "", expertise };
            })
        );
        allJudges = JSON.parse(JSON.stringify(rawList));
    } catch (e) { }

    // ── Assigned judges for this event ────────────
    let assignedJudges: any[] = [];
    try {
        const assignedRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "event_judges", [
            Query.equal("event_id", eventId),
        ]);

        // Submissions total for scoring progress
        let totalSubs = 0;
        try {
            const subCountRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submissions", [
                Query.equal("event_id", eventId),
                Query.limit(1),
            ]);
            totalSubs = subCountRes.total;
        } catch (e) { }

        const rawAssigned = await Promise.all(
            assignedRes.documents.map(async (doc: any) => {
                let profileData: any = null;
                try {
                    profileData = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", doc.judge_id);
                } catch (e) { }

                // Count unique submissions scored by this judge
                let scoredCount = 0;
                try {
                    const scoresRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_scores", [
                        Query.equal("judge_id", doc.judge_id),
                    ]);
                    const uniqueSubs = new Set(scoresRes.documents.map((s: any) => s.submission_id));
                    scoredCount = Math.min(uniqueSubs.size, totalSubs);
                } catch (e) { }

                return {
                    assignment_id: doc.$id,
                    judge_id: doc.judge_id,
                    full_name: profileData?.full_name || "Unknown Judge",
                    email: profileData?.email || "",
                    scoredCount,
                    totalSubmissions: totalSubs,
                };
            })
        );
        assignedJudges = JSON.parse(JSON.stringify(rawAssigned));
    } catch (e) { }

    // ── Submissions stats ──────────────────────────
    let totalSubmissions = 0;
    let scoredCount = 0;
    try {
        const subRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submissions", [
            Query.equal("event_id", eventId),
            Query.limit(1),
        ]);
        totalSubmissions = subRes.total;
    } catch (e) { }

    try {
        const scoredRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submissions", [
            Query.equal("event_id", eventId),
            Query.notEqual("status", "pending"),
            Query.limit(1),
        ]);
        scoredCount = scoredRes.total;
    } catch (e) { }

    const assignedIds = new Set(assignedJudges.map((j: any) => j.judge_id));
    const unassignedJudges = allJudges.filter((j) => !assignedIds.has(j.id));
    const statusCfg = STATUS_CONFIG[event.results_status] || STATUS_CONFIG.not_started;
    const completionPct = totalSubmissions > 0 ? Math.round((scoredCount / totalSubmissions) * 100) : 0;

    // ── Icon candidate ────────────────────────────
    let iconCandidate: any = null;
    try {
        const iconRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_results", [
            Query.equal("event_id", eventId),
            Query.equal("is_icon", true),
            Query.limit(1),
        ]);
        if (iconRes.documents.length > 0) {
            const r = iconRes.documents[0];
            let student_name = "Unknown";
            let school_name = "Unknown School";
            let submission_title = "";
            try {
                const prof = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", r.student_id);
                student_name = prof.full_name || "Unknown";
                if (prof.school_id) {
                    const sch = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "schools", prof.school_id);
                    school_name = sch.name || "Unknown School";
                }
            } catch (e) { }
            try {
                const subRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submissions", [
                    Query.equal("student_id", r.student_id),
                    Query.equal("event_id", eventId),
                    Query.limit(1),
                ]);
                submission_title = subRes.documents[0]?.title || "";
            } catch (e) { }
            iconCandidate = JSON.parse(JSON.stringify({
                student_id: r.student_id,
                student_name,
                school_name,
                submission_title,
                weighted_score: r.weighted_score || 0,
                is_icon: r.is_icon,
                icon_approved: r.icon_approved || false,
            }));
        }
    } catch (e) { }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">

            {/* ── Top navigation ── */}
            <div className="flex items-center justify-between">
                <Link
                    href="/dashboard/events"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Back to Events
                </Link>
                <Badge className={`${statusCfg.color} border font-black text-[10px] uppercase tracking-widest rounded-full px-5 py-2 flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                </Badge>
            </div>

            {/* ── Hero header ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-10 border border-white/5 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                            Scoring & Evaluation Control
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black font-outfit text-white leading-tight">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {format(new Date(event.end_date), "dd MMM yyyy")}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="flex items-center gap-1.5">
                                <ClipboardList className="w-3.5 h-3.5" />
                                {criteria.length} criteria
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                {assignedJudges.length} judges assigned
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-4xl font-black font-outfit text-white">{totalSubmissions}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Submissions</div>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="text-center">
                            <div className="text-4xl font-black font-outfit text-indigo-400">{completionPct}%</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Scored</div>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="relative z-10 mt-8">
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-1000"
                            style={{ width: `${completionPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <span>{scoredCount} scored</span>
                        <span>{totalSubmissions - scoredCount} pending</span>
                    </div>
                </div>
            </div>

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Entries", value: totalSubmissions, icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Judges Assigned", value: assignedJudges.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Rubric Criteria", value: criteria.length, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Judges Available", value: unassignedJudges.length, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border-2 border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div>
                            <div className="text-2xl font-black font-outfit text-slate-900">{s.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mt-0.5">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main content grid ── */}
            <div className="grid lg:grid-cols-12 gap-8">

                {/* LEFT: Judge Management + Icon (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <ScoringMonitor
                        event={{
                            id: event.$id,
                            title: event.title,
                            results_status: event.results_status || "not_started",
                        }}
                        allJudges={allJudges}
                        assignedJudges={assignedJudges}
                        submissionStats={{ total: totalSubmissions, scored: scoredCount, pending: totalSubmissions - scoredCount }}
                    />
                    <EventIconPanel
                        eventId={eventId}
                        eventTitle={event.title}
                        icon={iconCandidate}
                        isLocked={["not_started", "scoring_open"].includes(event.results_status || "not_started")}
                    />
                </div>

                {/* RIGHT: Rubric Builder (7 cols) */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black font-outfit uppercase tracking-tight text-slate-900">
                                        Evaluation Rubric
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Define scoring criteria — must total 100%
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <RubricBuilder eventId={eventId} initialCriteria={criteria} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
