"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    assignJudgeToEventAction,
    removeJudgeFromEventAction,
    updateEventResultsStatusAction,
    computeResultsAction,
    publishResultsAction,
} from "@/app/actions/evaluation";
import { useRouter } from "next/navigation";
import {
    UserPlus, UserMinus, Users, Loader2, Lock, BarChart3, Send,
    CheckCircle2, Clock, RefreshCw, Trophy, Shield, Search,
    ChevronRight, AlertTriangle, Zap
} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

/* ─── Types ──────────────────────────────────────────────── */
interface Judge {
    id: string;
    full_name: string;
    email: string;
    expertise: string;
}

interface AssignedJudge {
    assignment_id: string;
    judge_id: string;
    full_name: string;
    email: string;
    scoredCount: number;
    totalSubmissions: number;
}

interface ScoringMonitorProps {
    event: { id: string; title: string; results_status: string };
    allJudges: Judge[];
    assignedJudges: AssignedJudge[];
    submissionStats: { total: number; scored: number; pending: number };
}

/* ─── Status config ──────────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
    label: string;
    ringColor: string;
    iconColor: string;
    bg: string;
    border: string;
    icon: any;
}> = {
    not_started: { label: "Not Started", ringColor: "ring-slate-300", iconColor: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", icon: Clock },
    scoring_open: { label: "Scoring Open", ringColor: "ring-blue-400", iconColor: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: RefreshCw },
    scoring_locked: { label: "Scoring Locked", ringColor: "ring-amber-400", iconColor: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Lock },
    review: { label: "Under Review", ringColor: "ring-purple-400", iconColor: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: BarChart3 },
    published: { label: "Results Published", ringColor: "ring-emerald-400", iconColor: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
};

/* ─── Avatar helper ──────────────────────────────────────── */
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
    const palettes = [
        "from-indigo-500 to-purple-600",
        "from-blue-500 to-indigo-600",
        "from-violet-500 to-purple-600",
        "from-sky-500 to-blue-600",
        "from-purple-500 to-pink-600",
    ];
    const index = (name.charCodeAt(0) || 0) % palettes.length;
    const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    return (
        <div className={`${sz} rounded-xl bg-gradient-to-br ${palettes[index]} flex items-center justify-center text-white font-black shrink-0`}>
            {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────── */
export function ScoringMonitor({ event, allJudges, assignedJudges: initialAssigned, submissionStats }: ScoringMonitorProps) {
    const [assignedJudges, setAssignedJudges] = useState<AssignedJudge[]>(initialAssigned);
    const [loading, setLoading] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const router = useRouter();

    const statusCfg = STATUS_CONFIG[event.results_status] || STATUS_CONFIG.not_started;
    const StatusIcon = statusCfg.icon;

    const assignedIds = useMemo(() => new Set(assignedJudges.map(j => j.judge_id)), [assignedJudges]);
    const unassigned = useMemo(
        () => allJudges.filter(j => !assignedIds.has(j.id) && (
            !search ||
            j.full_name.toLowerCase().includes(search.toLowerCase()) ||
            j.email.toLowerCase().includes(search.toLowerCase()) ||
            j.expertise.toLowerCase().includes(search.toLowerCase())
        )),
        [allJudges, assignedIds, search]
    );

    const isLocked = ["scoring_locked", "review", "published"].includes(event.results_status);

    /* ── Actions ── */
    const handleAssign = async (judge: Judge) => {
        setLoading(`assign-${judge.id}`);
        const res = await assignJudgeToEventAction(event.id, judge.id);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        // Optimistic UI update
        setAssignedJudges(prev => [...prev, {
            assignment_id: `tmp-${judge.id}`,
            judge_id: judge.id,
            full_name: judge.full_name,
            email: judge.email,
            scoredCount: 0,
            totalSubmissions: submissionStats.total,
        }]);
        toast.success(`${judge.full_name} assigned to event`);
        router.refresh();
    };

    const handleRemove = async (judgeId: string, name: string) => {
        setLoading(`remove-${judgeId}`);
        const res = await removeJudgeFromEventAction(event.id, judgeId);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        setAssignedJudges(prev => prev.filter(j => j.judge_id !== judgeId));
        toast.success(`${name} removed from event`);
        router.refresh();
    };

    const handleStatusChange = async (newStatus: string) => {
        setLoading("status");
        const res = await updateEventResultsStatusAction(event.id, newStatus);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label}`);
        router.refresh();
    };

    const handleCompute = async () => {
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
        toast.success(`Published! ${res.badgeCount} badges generated.`);
        router.refresh();
    };

    /* ── Render ── */
    return (
        <div className="space-y-5">

            {/* ── Status Pipeline Card ── */}
            <div className={`rounded-2xl border-2 ${statusCfg.border} ${statusCfg.bg} p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${statusCfg.bg} ring-2 ${statusCfg.ringColor} flex items-center justify-center`}>
                            <StatusIcon className={`w-4 h-4 ${statusCfg.iconColor}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
                            <p className={`font-black text-sm ${statusCfg.iconColor}`}>{statusCfg.label}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>

                {/* Pipeline steps */}
                <div className="flex items-center gap-1">
                    {["not_started", "scoring_open", "scoring_locked", "review", "published"].map((s, i) => {
                        const steps = ["not_started", "scoring_open", "scoring_locked", "review", "published"];
                        const currentIdx = steps.indexOf(event.results_status);
                        const done = i < currentIdx;
                        const current = i === currentIdx;
                        return (
                            <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                                <div className={`h-1.5 flex-1 rounded-full transition-all ${done ? "bg-indigo-500" : current ? "bg-indigo-300" : "bg-slate-200"}`} />
                                {i === 4 && (
                                    <div className={`w-3 h-3 rounded-full shrink-0 ${done || current ? "bg-emerald-500" : "bg-slate-200"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                    {event.results_status === "not_started" && (
                        <Button
                            onClick={() => handleStatusChange("scoring_open")}
                            disabled={loading === "status"}
                            size="sm"
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest gap-1.5"
                        >
                            {loading === "status" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            Open Scoring
                        </Button>
                    )}

                    {event.results_status === "scoring_open" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" disabled={!!loading} className="rounded-xl bg-amber-600 hover:bg-amber-700 font-black uppercase text-xs tracking-widest gap-1.5">
                                    <Lock className="w-3.5 h-3.5" /> Lock & Compute
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black font-outfit flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Lock Scoring?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This locks all judge scoring and computes weighted rankings for {submissionStats.scored} scored submissions. Judges will no longer be able to edit scores. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCompute} className="rounded-xl bg-amber-600 hover:bg-amber-700">
                                        {loading === "compute" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Lock className="w-3.5 h-3.5 mr-1" />}
                                        Lock & Compute
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {event.results_status === "scoring_locked" && (
                        <Button
                            onClick={() => handleStatusChange("review")}
                            disabled={loading === "status"}
                            size="sm"
                            className="rounded-xl bg-purple-600 hover:bg-purple-700 font-black uppercase text-xs tracking-widest gap-1.5"
                        >
                            {loading === "status" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                            Move to Review
                        </Button>
                    )}

                    {event.results_status === "review" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest gap-1.5">
                                    <Trophy className="w-3.5 h-3.5" /> Publish Results
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black font-outfit flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-emerald-500" /> Publish Results?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will make rankings and results public, auto-generate winner badges, and notify all participants. This action cannot be reversed.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Review First</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePublish} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                        {loading === "publish" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                                        Publish & Generate Badges
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {event.results_status === "published" && (
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Results Live
                        </Badge>
                    )}
                </div>
            </div>

            {/* ── Assigned Judges ── */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <p className="font-black text-sm uppercase tracking-widest text-slate-700">Assigned Judges</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 font-black text-[10px] rounded-full px-3">
                        {assignedJudges.length}
                    </Badge>
                </div>

                <div className="divide-y divide-slate-50">
                    {assignedJudges.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No judges assigned yet</p>
                            <p className="text-xs text-slate-300 mt-1">Add judges from the pool below</p>
                        </div>
                    ) : assignedJudges.map((j) => {
                        const pct = j.totalSubmissions > 0
                            ? Math.round((j.scoredCount / j.totalSubmissions) * 100)
                            : 0;
                        const isDone = j.scoredCount >= j.totalSubmissions && j.totalSubmissions > 0;
                        const isActive = j.scoredCount > 0 && !isDone;
                        return (
                            <div key={j.judge_id} className="px-5 py-4 flex items-center gap-3 hover:bg-slate-50/60 transition-colors group">
                                <Avatar name={j.full_name} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-black text-sm text-slate-900 truncate">{j.full_name}</p>
                                        <Badge className={`shrink-0 text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${isDone ? "bg-emerald-100 text-emerald-700" :
                                            isActive ? "bg-blue-100 text-blue-700" :
                                                "bg-slate-100 text-slate-500"
                                            }`}>
                                            {isDone ? "Done" : isActive ? "Active" : "Pending"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Progress value={pct} className="h-1 flex-1" />
                                        <span className="text-[10px] font-black text-slate-400 shrink-0">
                                            {j.scoredCount}/{j.totalSubmissions}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{j.email}</p>
                                </div>

                                {!isLocked && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                disabled={loading === `remove-${j.judge_id}`}
                                                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                                                title="Remove judge"
                                            >
                                                {loading === `remove-${j.judge_id}`
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <UserMinus className="w-3.5 h-3.5" />
                                                }
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="font-black font-outfit">Remove Judge?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Remove <strong>{j.full_name}</strong> from this event? Their existing scores will be retained.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleRemove(j.judge_id, j.full_name)}
                                                    className="rounded-xl bg-red-600 hover:bg-red-700"
                                                >
                                                    Remove
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Available Judge Pool ── */}
            {!isLocked && (
                <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <p className="font-black text-sm uppercase tracking-widest text-slate-700">Judge Pool</p>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 font-black text-[10px] rounded-full px-3">
                                {unassigned.length} available
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                                placeholder="Search by name, email or expertise..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-9 rounded-xl text-xs border-slate-200 bg-slate-50 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                        {unassigned.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                                    {search ? "No judges match your search" : "All judges assigned!"}
                                </p>
                            </div>
                        ) : unassigned.map((j) => (
                            <div key={j.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors group">
                                <Avatar name={j.full_name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-800 truncate">{j.full_name}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[10px] text-slate-400 truncate">{j.email}</p>
                                        {j.expertise && (
                                            <>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                                <p className="text-[10px] font-bold text-indigo-500 truncate">{j.expertise}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAssign(j)}
                                    disabled={!!loading}
                                    title={`Assign ${j.full_name}`}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all shrink-0 border-2 border-transparent hover:border-indigo-600"
                                >
                                    {loading === `assign-${j.id}`
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <UserPlus className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isLocked && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-black text-sm text-amber-700 uppercase tracking-wider">Judge Assignment Locked</p>
                        <p className="text-xs text-amber-600 mt-0.5">Scoring has been locked. No changes to judge assignments are permitted.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
