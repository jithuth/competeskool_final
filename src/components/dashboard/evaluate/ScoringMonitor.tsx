"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assignJudgeToEventAction, removeJudgeFromEventAction, updateEventResultsStatusAction, computeResultsAction, publishResultsAction } from "@/app/actions/evaluation";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus, Loader2, Lock, BarChart3, Send, CheckCircle2, Clock, AlertTriangle, RefreshCw, Trophy } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Judge {
    id: string;
    full_name: string;
    email: string;
    expertise: string;
}

interface EventJudge {
    judge_id: string;
    profiles: { full_name: string; email: string };
    scoredCount: number;
    totalSubmissions: number;
}

interface ScoringMonitorProps {
    event: {
        id: string;
        title: string;
        results_status: string;
    };
    allJudges: Judge[];
    assignedJudges: EventJudge[];
    submissionStats: {
        total: number;
        scored: number;
        pending: number;
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; next?: string; nextLabel?: string }> = {
    not_started: { label: "Not Started", color: "bg-slate-100 text-slate-600", icon: Clock, next: "scoring_open", nextLabel: "Open Scoring" },
    scoring_open: { label: "Scoring Open", color: "bg-blue-100 text-blue-700", icon: RefreshCw, next: "scoring_locked", nextLabel: "Lock Scoring" },
    scoring_locked: { label: "Scoring Locked", color: "bg-amber-100 text-amber-700", icon: Lock },
    review: { label: "Under Review", color: "bg-purple-100 text-purple-700", icon: BarChart3, next: "published", nextLabel: "Publish Results" },
    published: { label: "Results Published", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

export function ScoringMonitor({ event, allJudges, assignedJudges, submissionStats }: ScoringMonitorProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();
    const statusCfg = STATUS_CONFIG[event.results_status] || STATUS_CONFIG.not_started;
    const assignedIds = new Set(assignedJudges.map(j => j.judge_id));
    const unassignedJudges = allJudges.filter(j => !assignedIds.has(j.id));

    const handleAssign = async (judgeId: string) => {
        setLoading(`assign-${judgeId}`);
        const res = await assignJudgeToEventAction(event.id, judgeId);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Judge assigned to event");
        router.refresh();
    };

    const handleRemove = async (judgeId: string) => {
        setLoading(`remove-${judgeId}`);
        const res = await removeJudgeFromEventAction(event.id, judgeId);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Judge removed from event");
        router.refresh();
    };

    const handleStatusChange = async (newStatus: string) => {
        setLoading("status");
        const res = await updateEventResultsStatusAction(event.id, newStatus);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label}`);
        router.refresh();
    };

    const handleComputeResults = async () => {
        setLoading("compute");
        const res = await computeResultsAction(event.id);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success(`Results computed for ${res.count} submissions!`);
        router.refresh();
    };

    const handlePublish = async () => {
        setLoading("publish");
        const res = await publishResultsAction(event.id);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success(`Results published! ${res.badgeCount} badges generated.`);
        router.refresh();
    };

    const completionPct = submissionStats.total > 0
        ? Math.round((submissionStats.scored / submissionStats.total) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* Status Banner */}
            <div className={`p-6 rounded-2xl flex items-center justify-between ${statusCfg.color} border`}>
                <div className="flex items-center gap-3">
                    <statusCfg.icon className="w-5 h-5" />
                    <div>
                        <p className="font-black text-sm uppercase tracking-widest">Current Status</p>
                        <p className="font-medium text-sm mt-0.5 opacity-80">{statusCfg.label}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Open Scoring */}
                    {event.results_status === "not_started" && (
                        <Button onClick={() => handleStatusChange("scoring_open")} disabled={loading === "status"} className="rounded-xl h-10 bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest">
                            {loading === "status" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                            Open Scoring
                        </Button>
                    )}
                    {/* Lock Scoring → triggers computation */}
                    {event.results_status === "scoring_open" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={loading === "compute"} className="rounded-xl h-10 bg-amber-600 hover:bg-amber-700 font-black uppercase text-xs tracking-widest">
                                    <Lock className="w-4 h-4 mr-1.5" /> Lock & Compute
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black font-outfit">Lock Scoring?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will prevent judges from editing scores and compute weighted results + rankings for all {submissionStats.scored} scored submissions. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleComputeResults} className="rounded-xl bg-amber-600 hover:bg-amber-700">
                                        {loading === "compute" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                                        Lock & Compute Results
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {/* Publish Results */}
                    {event.results_status === "review" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest">
                                    <Trophy className="w-4 h-4 mr-1.5" /> Publish Results
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black font-outfit">Publish Results?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will make results and rankings PUBLIC, auto-generate cryptographic badges for all winners, and notify students. This action cannot be reversed.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Review First</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePublish} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                        {loading === "publish" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                                        Publish & Generate Badges
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Scoring Progress */}
            <div className="p-6 rounded-2xl bg-white border-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">Scoring Progress</h3>
                    <span className="text-2xl font-black font-outfit">{completionPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${completionPct}%` }} />
                </div>
                <div className="flex gap-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span className="text-slate-700">{submissionStats.scored} Scored</span>
                    <span>{submissionStats.pending} Pending</span>
                    <span>/ {submissionStats.total} Total</span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Assigned Judges */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Assigned Judges ({assignedJudges.length})
                    </h3>
                    <div className="space-y-3">
                        {assignedJudges.length === 0 && (
                            <div className="p-4 rounded-2xl border-2 border-dashed text-center text-slate-300 text-sm font-medium">
                                No judges assigned yet
                            </div>
                        )}
                        {assignedJudges.map((j) => (
                            <div key={j.judge_id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-slate-100">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                                    {j.profiles?.full_name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 truncate">{j.profiles?.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{j.scoredCount}/{j.totalSubmissions} scored</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={`text-[9px] rounded-full px-2 ${j.scoredCount === j.totalSubmissions && j.totalSubmissions > 0 ? "bg-emerald-100 text-emerald-700" : j.scoredCount > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                        {j.scoredCount === j.totalSubmissions && j.totalSubmissions > 0 ? "Done" : j.scoredCount > 0 ? "Active" : "Pending"}
                                    </Badge>
                                    {event.results_status === "scoring_open" && (
                                        <button onClick={() => handleRemove(j.judge_id)} disabled={loading === `remove-${j.judge_id}`} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                            {loading === `remove-${j.judge_id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Available Judges to Assign */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Available Judges ({unassignedJudges.length})
                    </h3>
                    <div className="space-y-3">
                        {unassignedJudges.length === 0 && (
                            <div className="p-4 rounded-2xl border-2 border-dashed text-center text-slate-300 text-sm font-medium">
                                All judges assigned
                            </div>
                        )}
                        {unassignedJudges.map((j) => (
                            <div key={j.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shrink-0">
                                    {j.full_name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-700 truncate">{j.full_name}</p>
                                    {j.expertise && <p className="text-[10px] text-slate-400 font-medium truncate">{j.expertise}</p>}
                                </div>
                                {event.results_status !== "published" && (
                                    <button onClick={() => handleAssign(j.id)} disabled={!!loading} className="w-8 h-8 rounded-xl flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-all">
                                        {loading === `assign-${j.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
