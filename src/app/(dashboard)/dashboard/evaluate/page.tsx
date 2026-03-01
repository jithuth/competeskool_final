import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, Eye, Video, Download, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function EvaluatePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const isJudge = profile?.role === "judge";
    const isSuperAdmin = profile?.role === "super_admin";
    if (!isJudge && !isSuperAdmin) redirect("/dashboard");

    // ── Fetch assigned events (with full event details for judges) ──────────────
    let assignedEventIds: string[] = [];
    let assignedEvents: any[] = [];

    if (isJudge) {
        const { data: assignments } = await supabase
            .from("event_judges")
            .select("event_id, events!event_judges_event_id_fkey(id, title, start_date, end_date, status, results_status)")
            .eq("judge_id", user.id);
        assignedEventIds = assignments?.map((a: any) => a.event_id) || [];
        assignedEvents = assignments?.map((a: any) => a.events).filter(Boolean) || [];
    }

    // No assignments for judge
    if (isJudge && assignedEventIds.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-4xl font-black font-outfit uppercase tracking-tight">Evaluation Center</h1>
                    <p className="text-slate-500 font-medium mt-1">You have not been assigned to any events yet.</p>
                </div>
                <div className="text-center py-24 border-2 border-dashed rounded-3xl">
                    <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No Assignments</p>
                    <p className="text-slate-400 text-sm mt-1">Contact the administrator to be assigned to an event.</p>
                </div>
            </div>
        );
    }

    // ── Submissions ─────────────────────────────────────────────────────────────
    let submissionsQuery = supabase
        .from("submissions")
        .select(`
            id, title, status, created_at, student_id,
            events!submissions_event_id_fkey(id, title, results_status),
            profiles!submissions_student_id_fkey(full_name, schools(name)),
            submission_videos(type, youtube_url, vimeo_url, video_url)
        `)
        .order("created_at", { ascending: false });

    if (isJudge && assignedEventIds.length > 0) {
        submissionsQuery = submissionsQuery.in("event_id", assignedEventIds);
    }

    const { data: submissions } = await submissionsQuery;

    // ── Scoring state ───────────────────────────────────────────────────────────
    const { data: myScores } = await supabase
        .from("submission_scores")
        .select("submission_id, criterion_id")
        .eq("judge_id", user.id);

    const scoreCountMap = new Map<string, number>();
    for (const s of myScores || []) {
        scoreCountMap.set(s.submission_id, (scoreCountMap.get(s.submission_id) || 0) + 1);
    }

    const eventIds = [...new Set(submissions?.map((s: any) => s.events?.id).filter(Boolean) || [])];
    const { data: criteriaRows } = await supabase
        .from("evaluation_criteria")
        .select("event_id")
        .in("event_id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"]);

    const criteriaCountMap = new Map<string, number>();
    for (const c of criteriaRows || []) {
        criteriaCountMap.set(c.event_id, (criteriaCountMap.get(c.event_id) || 0) + 1);
    }

    const isFullyScored = (sub: any) => {
        const scored = scoreCountMap.get(sub.id) || 0;
        const total = criteriaCountMap.get(sub.events?.id) || 1;
        return scored >= total && total > 0;
    };

    // ── Group submissions by event ──────────────────────────────────────────────
    const submissionsByEvent = new Map<string, { event: any; submissions: any[] }>();
    for (const sub of submissions || []) {
        const eid = sub.events?.id;
        if (!eid) continue;
        if (!submissionsByEvent.has(eid)) {
            submissionsByEvent.set(eid, { event: sub.events, submissions: [] });
        }
        submissionsByEvent.get(eid)!.submissions.push(sub);
    }

    // For super admin: build event list from submissions
    const displayEvents = isJudge
        ? assignedEvents
        : [...submissionsByEvent.values()].map(g => g.event);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-4xl font-black font-outfit uppercase tracking-tight">
                    Evaluation <span className="text-primary italic">Center</span>
                </h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                    {[...submissionsByEvent.values()].filter(g => g.submissions.some(s => !isFullyScored(s))).length} Events with Pending Work
                </p>
            </div>

            {/* ── Assigned Events Overview ──────────────────────────────────── */}
            {displayEvents.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                        {isJudge ? "Your Assigned Events" : "All Events"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {displayEvents.map((event: any) => {
                            const group = submissionsByEvent.get(event.id);
                            const total = group?.submissions.length || 0;
                            const done = group?.submissions.filter(isFullyScored).length || 0;
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                            const allDone = pct === 100 && total > 0;
                            return (
                                <div
                                    key={event.id}
                                    className={`p-5 rounded-2xl border-2 space-y-3 transition-all ${allDone
                                        ? "bg-emerald-50 border-emerald-200"
                                        : "bg-white border-indigo-100 hover:border-indigo-200 hover:shadow-md"}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 truncate">{event.title}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                                {done} / {total} submissions evaluated
                                            </p>
                                        </div>
                                        {allDone ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">Done</Badge>
                                        ) : (
                                            <Badge className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">In Progress</Badge>
                                        )}
                                    </div>
                                    <Progress value={pct} className="h-1.5 rounded-full" />
                                    <p className="text-[10px] text-slate-400 font-black">{pct}% complete</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Submissions grouped by event ──────────────────────────────── */}
            {[...submissionsByEvent.entries()].map(([eventId, group]) => {
                const pending = group.submissions.filter(s => !isFullyScored(s));
                const completed = group.submissions.filter(isFullyScored);
                const pct = group.submissions.length > 0
                    ? Math.round((completed.length / group.submissions.length) * 100)
                    : 0;

                return (
                    <div key={eventId} className="space-y-4">
                        {/* Event header */}
                        <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-100">
                            <Trophy className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h2 className="font-black text-slate-900 uppercase tracking-wide text-sm truncate">
                                    {group.event.title}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {pending.length} pending · {completed.length} completed · {pct}% done
                                </p>
                            </div>
                            {pct === 100 && group.submissions.length > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> All Done
                                </Badge>
                            )}
                        </div>

                        {/* Pending for this event */}
                        {pending.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5 pl-1">
                                    <Clock className="w-3 h-3" /> Awaiting Evaluation ({pending.length})
                                </p>
                                {pending.map((sub: any) => (
                                    <div key={sub.id} className="group flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-amber-100 hover:border-amber-200 hover:shadow-md transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                            <Video className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 truncate">{sub.title || "Untitled Submission"}</p>
                                            <p className="text-xs text-slate-400 font-medium">{sub.profiles?.full_name} · {(sub.profiles as any)?.schools?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full">Pending</Badge>
                                            {isSuperAdmin && (() => {
                                                const vid = (sub.submission_videos as any[])?.[0];
                                                const ytId = vid?.youtube_url?.split("v=")?.[1]?.split("&")?.[0];
                                                return ytId ? (
                                                    <a href={`/api/admin/download-video?videoId=${ytId}&title=${encodeURIComponent(sub.title || "submission")}`} download title="Download video">
                                                        <Button size="sm" variant="outline" className="h-9 rounded-xl font-black uppercase text-[9px] tracking-widest gap-1.5 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700">
                                                            <Download className="w-3.5 h-3.5" /> Download
                                                        </Button>
                                                    </a>
                                                ) : null;
                                            })()}
                                            <Link href={`/dashboard/evaluate/${sub.id}`}>
                                                <Button size="sm" className="h-9 rounded-xl bg-slate-900 hover:bg-indigo-600 font-black uppercase text-[9px] tracking-widest gap-1.5">
                                                    <ClipboardList className="w-3.5 h-3.5" /> Evaluate
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Completed for this event */}
                        {completed.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 pl-1">
                                    <CheckCircle2 className="w-3 h-3" /> Evaluated ({completed.length})
                                </p>
                                {completed.map((sub: any) => (
                                    <div key={sub.id} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-700 truncate">{sub.title || "Untitled Submission"}</p>
                                            <p className="text-xs text-slate-400 font-medium">{sub.profiles?.full_name} · {(sub.profiles as any)?.schools?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full">Scored</Badge>
                                            {isSuperAdmin && (() => {
                                                const vid = (sub.submission_videos as any[])?.[0];
                                                const ytId = vid?.youtube_url?.split("v=")?.[1]?.split("&")?.[0];
                                                return ytId ? (
                                                    <a href={`/api/admin/download-video?videoId=${ytId}&title=${encodeURIComponent(sub.title || "submission")}`} download title="Download video">
                                                        <Button size="sm" variant="outline" className="h-9 rounded-xl font-black uppercase text-[9px] tracking-widest gap-1.5 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700">
                                                            <Download className="w-3.5 h-3.5" /> Download
                                                        </Button>
                                                    </a>
                                                ) : null;
                                            })()}
                                            <Link href={`/dashboard/evaluate/${sub.id}`}>
                                                <Button variant="outline" size="sm" className="h-9 rounded-xl font-black uppercase text-[9px] tracking-widest gap-1.5">
                                                    <Eye className="w-3.5 h-3.5" /> Review
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {submissions?.length === 0 && (
                <div className="text-center py-24 border-2 border-dashed rounded-3xl">
                    <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No Submissions Yet</p>
                    <p className="text-slate-400 text-sm mt-1">Submissions for your assigned events will appear here.</p>
                </div>
            )}
        </div>
    );
}
