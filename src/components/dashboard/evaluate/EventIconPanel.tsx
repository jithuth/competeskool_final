"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveEventIconAction, revokeEventIconAction } from "@/app/actions/evaluation";
import { Crown, CheckCircle2, XCircle, Star, ShieldCheck, Loader2, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface IconCandidate {
    student_id: string;
    student_name: string;
    school_name: string;
    submission_title: string;
    weighted_score: number;
    is_icon: boolean;
    icon_approved: boolean;
}

interface EventIconPanelProps {
    eventId: string;
    eventTitle: string;
    icon: IconCandidate | null;   // null = results not computed yet
    isLocked: boolean;            // scoring is open = can't approve yet
}

export function EventIconPanel({ eventId, eventTitle, icon, isLocked }: EventIconPanelProps) {
    const [loading, setLoading] = useState<"approve" | "revoke" | null>(null);
    const router = useRouter();

    const handleApprove = async () => {
        setLoading("approve");
        const res = await approveEventIconAction(eventId);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Event Icon officially approved and published!");
        router.refresh();
    };

    const handleRevoke = async () => {
        setLoading("revoke");
        const res = await revokeEventIconAction(eventId);
        setLoading(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Icon approval revoked");
        router.refresh();
    };

    /* ── Not yet computed ── */
    if (!icon) {
        return (
            <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <p className="font-black text-sm uppercase tracking-widest text-slate-700">Event Icon</p>
                </div>
                <div className="px-5 py-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-7 h-7 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No icon yet</p>
                    <p className="text-xs text-slate-300 mt-1">
                        {isLocked
                            ? "Lock scoring and compute results to determine the icon"
                            : "Compute results to automatically select the top-ranked participant"}
                    </p>
                </div>
            </div>
        );
    }

    const initials = icon.student_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <p className="font-black text-sm uppercase tracking-widest text-slate-700">Event Icon</p>
                </div>
                <Badge className={`text-[9px] font-black uppercase tracking-widest rounded-full px-3 border ${icon.icon_approved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                    {icon.icon_approved ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" />Approved</>
                    ) : (
                        <><Star className="w-3 h-3 mr-1" />Pending Approval</>
                    )}
                </Badge>
            </div>

            {/* Icon candidate card */}
            <div className="p-5">
                <div className={`relative rounded-2xl p-5 border-2 transition-all ${icon.icon_approved
                        ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}>

                    {/* Rank 1 crown badge */}
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md ${icon.icon_approved
                                ? "bg-gradient-to-br from-amber-400 to-yellow-600"
                                : "bg-gradient-to-br from-slate-400 to-slate-600"
                            }`}>
                            {initials || <User className="w-6 h-6" />}
                        </div>

                        <div className="min-w-0">
                            <p className="font-black text-base text-slate-900 truncate">{icon.student_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{icon.school_name}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5 italic">"{icon.submission_title}"</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 bg-white/60 rounded-xl px-4 py-2 text-center border border-white/80">
                            <div className="text-xl font-black font-outfit text-amber-600">{icon.weighted_score.toFixed(1)}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Score</div>
                        </div>
                        <div className="flex-1 bg-white/60 rounded-xl px-4 py-2 text-center border border-white/80">
                            <div className="text-xl font-black font-outfit text-slate-800">#1</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Rank</div>
                        </div>
                        <div className="flex-1 bg-white/60 rounded-xl px-4 py-2 text-center border border-white/80">
                            <div className="text-xl font-black font-outfit text-indigo-600">
                                {icon.icon_approved ? "✓" : "?"}
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Featured</div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 space-y-2">
                    {!icon.icon_approved ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    disabled={!!loading}
                                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 h-11 shadow-lg shadow-amber-200"
                                >
                                    {loading === "approve"
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <ShieldCheck className="w-3.5 h-3.5" />
                                    }
                                    Approve as Event Icon
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black font-outfit flex items-center gap-2">
                                        <Crown className="w-5 h-5 text-amber-500" />
                                        Approve Event Icon?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will officially feature <strong>{icon.student_name}</strong> as the <strong>Icon of {eventTitle}</strong>. Their achievement will be displayed prominently on the public results page. You can revoke this at any time before publishing.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleApprove}
                                        className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                                    >
                                        <Crown className="w-3.5 h-3.5 mr-1.5" /> Yes, Feature as Icon
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Featured on public results page</p>
                            </div>
                            <Button
                                variant="ghost"
                                disabled={!!loading}
                                onClick={handleRevoke}
                                className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 hover:bg-red-50 gap-2 h-9"
                            >
                                {loading === "revoke"
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <XCircle className="w-3 h-3" />
                                }
                                Revoke Icon Status
                            </Button>
                        </div>
                    )}
                </div>

                {/* Info */}
                <p className="text-[9px] text-slate-400 text-center mt-3 leading-relaxed">
                    The Event Icon is automatically selected as the top-ranked participant after results are computed.
                    Approval makes this visible on the public event results page.
                </p>
            </div>
        </div>
    );
}
