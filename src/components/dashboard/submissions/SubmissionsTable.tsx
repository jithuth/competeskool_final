"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Eye,
    Clock,
    CheckCircle2,
    AlertCircle,
    Edit3,
    Film,
    Trophy,
    User as UserIcon,
    Calendar,
    ArrowRight,
    Star
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Loader2 } from "lucide-react";

export function SubmissionsTable({ submissions, role }: { submissions: any[], role: string }) {
    const supabase = createClient();
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleRedo = async (id: string) => {
        if (!confirm("Are you sure you want to reset this submission? This will delete the current entry and allow the student to submit a fresh one.")) return;

        setDeletingId(id);
        const { error } = await supabase.from("submissions").delete().eq("id", id);

        if (error) {
            toast.error("Failed to reset submission");
        } else {
            toast.success("Submission reset successfully");
            router.refresh();
        }
        setDeletingId(null);
    };
    if (!submissions || submissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 border-4 border-dashed rounded-[3rem] bg-slate-50/50 text-slate-400 group transition-all hover:bg-slate-50 hover:border-primary/20">
                <div className="w-20 h-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Film className="w-10 h-10 text-slate-200" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-300">No Entries Found</p>
                <p className="text-sm mt-2 font-medium">Your competition history is waiting to be written.</p>
            </div>
        );
    }

    return (
        <div className="relative group/table">
            {/* Decorative background glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover/table:opacity-100 transition-opacity duration-1000" />

            <div className="relative border-2 border-slate-100 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50">
                <Table>
                    <TableHeader>
                        <TableRow className="border-none hover:bg-transparent bg-slate-50/50">
                            <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] pl-10 py-6 text-slate-400">Project & Arena</TableHead>
                            {role !== 'student' && <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Participant</TableHead>}
                            <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Milestone</TableHead>
                            <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Verdict</TableHead>
                            <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-right pr-10 text-slate-400">Command</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.map((sub) => (
                            <TableRow key={sub.id} className="group/row transition-all hover:bg-slate-50/80 border-slate-50">
                                <TableCell className="pl-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 group-hover/row:scale-110 transition-transform duration-300 shadow-sm border border-white">
                                            <Trophy className={cn("w-5 h-5", sub.score ? "text-amber-500" : "text-slate-400")} />
                                        </div>
                                        <div className="space-y-0.5 max-w-[200px]">
                                            <p className="font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover/row:text-primary transition-colors">{sub.title}</p>
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase px-2 py-0">
                                                    {sub.events?.title}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                {role !== 'student' && (
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                                {sub.profiles?.avatar_url ? (
                                                    <img src={sub.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <UserIcon className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-700 text-sm whitespace-nowrap">{sub.profiles?.full_name}</p>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">ID: {sub.student_id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                )}

                                <TableCell>
                                    <div className="space-y-1.5">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-[8px] font-black uppercase tracking-widest transition-all",
                                            sub.status === 'pending' ? "border-amber-100 bg-amber-50/50 text-amber-600 shadow-sm shadow-amber-100/50" :
                                                sub.status === 'reviewed' ? "border-emerald-100 bg-emerald-50/50 text-emerald-600 shadow-sm shadow-emerald-100/50" :
                                                    "border-slate-100 bg-slate-50 text-slate-400"
                                        )}>
                                            {sub.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                                            {sub.status === 'reviewed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                            {sub.status}
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold ml-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(sub.created_at), "MMM d, yyyy")}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    {sub.score !== null ? (
                                        <div className="flex items-end gap-1 group/score relative">
                                            <span className="text-2xl font-black text-slate-800 leading-none">{sub.score}</span>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter mb-0.5 leading-none">/ 100</span>
                                            <div className="flex gap-0.5 ml-2 pb-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("w-2 h-2", i < (sub.score / 20) ? "text-amber-400 fill-amber-400" : "text-slate-100 fill-slate-100")} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 animate-pulse text-slate-200">
                                            <div className="h-6 w-12 bg-slate-50 rounded-lg" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Pending Review</span>
                                        </div>
                                    )}
                                </TableCell>

                                <TableCell className="text-right pr-10">
                                    <div className="flex items-center justify-end gap-2">
                                        {(role === 'super_admin' || role === 'judge' || (role === 'teacher' && sub.status === 'pending')) && (
                                            <Link href={`/dashboard/evaluate`}>
                                                <Button variant="outline" size="sm" className="h-10 rounded-xl border-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all font-black text-[9px] uppercase tracking-widest px-4 group/btn">
                                                    Evaluate <ArrowRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </Link>
                                        )}
                                        {role === 'student' && sub.status === 'pending' && (
                                            <Link href={`/dashboard/submissions/${sub.id}/edit`}>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-all text-slate-400" title="Edit Details">
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                        {(role === 'teacher' || role === 'super_admin' || role === 'school_admin') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-slate-400"
                                                title="Reset for Redo"
                                                onClick={() => handleRedo(sub.id)}
                                                disabled={deletingId === sub.id}
                                            >
                                                {deletingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                            </Button>
                                        )}
                                        <Link href={`/dashboard/submissions/${sub.id}`}>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 hover:text-primary transition-all text-primary/60 border border-slate-50" title="View Submission & Video">
                                                <Film className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
