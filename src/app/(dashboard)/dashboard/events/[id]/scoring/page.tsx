import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { RubricBuilder } from "@/components/dashboard/evaluate/RubricBuilder";
import { ScoringMonitor } from "@/components/dashboard/evaluate/ScoringMonitor";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    not_started: { label: "Not Started", color: "bg-slate-100 text-slate-600" },
    scoring_open: { label: "Scoring Open", color: "bg-blue-100 text-blue-700" },
    scoring_locked: { label: "Locked", color: "bg-amber-100 text-amber-700" },
    review: { label: "Under Review", color: "bg-purple-100 text-purple-700" },
    published: { label: "Published", color: "bg-emerald-100 text-emerald-700" },
};

export default async function EventScoringPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "super_admin") redirect("/dashboard");

    const { data: event } = await supabase
        .from("events")
        .select("id, title, results_status, start_date, end_date")
        .eq("id", eventId)
        .single();
    if (!event) notFound();

    const { data: criteria } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .eq("event_id", eventId)
        .order("display_order");

    // All judges in system
    const { data: allJudgesRaw } = await supabase
        .from("profiles")
        .select("id, full_name, email, judges(expertise)")
        .eq("role", "judge")
        .eq("status", "approved");

    const allJudges = (allJudgesRaw || []).map((j: any) => ({
        id: j.id,
        full_name: j.full_name || "",
        email: j.email || "",
        expertise: j.judges?.[0]?.expertise || "",
    }));

    // Assigned judges for this event with scoring progress
    const { data: assignedRaw } = await supabase
        .from("event_judges")
        .select("judge_id, profiles!inner(full_name, email)")
        .eq("event_id", eventId);

    const { data: submissions } = await supabase
        .from("submissions")
        .select("id")
        .eq("event_id", eventId);
    const totalSubmissions = submissions?.length || 0;

    const assignedJudges = await Promise.all(
        (assignedRaw || []).map(async (aj: any) => {
            const { count } = await supabase
                .from("submission_scores")
                .select("submission_id", { count: "exact", head: true })
                .eq("judge_id", aj.judge_id);
            const uniqueCount = Math.min(count || 0, totalSubmissions);
            return {
                judge_id: aj.judge_id,
                profiles: aj.profiles,
                scoredCount: uniqueCount,
                totalSubmissions,
            };
        })
    );

    const scoredCount = (await supabase
        .from("submissions")
        .select("id")
        .eq("event_id", eventId)
        .neq("status", "pending")).data?.length || 0;

    const statusCfg = STATUS_LABELS[event.results_status] || STATUS_LABELS.not_started;

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-16 animate-in fade-in duration-500">
            {/* Breadcrumb Header */}
            <div className="space-y-4">
                <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Events
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black font-outfit text-slate-900 leading-tight">{event.title}</h1>
                        <p className="text-slate-400 text-sm font-medium mt-1">Evaluation & Scoring Management</p>
                    </div>
                    <Badge className={`${statusCfg.color} font-black text-[10px] uppercase tracking-widest rounded-full px-4 py-2`}>
                        {statusCfg.label}
                    </Badge>
                </div>
            </div>

            {/* Tab Sections */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-3xl bg-white border-2 hover:border-indigo-100 transition-all shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest text-slate-700">Evaluation Rubric</p>
                            <p className="text-[10px] text-slate-400 font-medium">{criteria?.length || 0} criteria defined</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-white border-2 hover:border-indigo-100 transition-all shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                            <Users2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest text-slate-700">Judge Assignment</p>
                            <p className="text-[10px] text-slate-400 font-medium">{assignedJudges.length} judges assigned</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: Rubric Builder */}
            <section className="bg-white rounded-[2rem] border-2 p-10 shadow-sm space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-black font-outfit uppercase tracking-tight">Evaluation Rubric</h2>
                    <p className="text-slate-400 text-sm font-medium">Define scoring criteria and weights for this event. Judges will score each submission against these criteria.</p>
                </div>
                <div className="border-t pt-6">
                    <RubricBuilder eventId={eventId} initialCriteria={criteria || []} />
                </div>
            </section>

            {/* Section 2: Scoring Monitor + Judge Assignment */}
            <section className="bg-white rounded-[2rem] border-2 p-10 shadow-sm space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-black font-outfit uppercase tracking-tight">Scoring Control Center</h2>
                    <p className="text-slate-400 text-sm font-medium">Assign judges, monitor progress, lock scoring, compute results, and publish the leaderboard.</p>
                </div>
                <div className="border-t pt-6">
                    <ScoringMonitor
                        event={{ id: event.id, title: event.title, results_status: event.results_status }}
                        allJudges={allJudges}
                        assignedJudges={assignedJudges}
                        submissionStats={{ total: totalSubmissions, scored: scoredCount, pending: totalSubmissions - scoredCount }}
                    />
                </div>
            </section>
        </div>
    );
}
