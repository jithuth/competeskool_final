"use client";

import { useState } from "react";
import {
    Pencil,
    Check,
    X,
    MoreHorizontal,
    Trash2,
    Copy,
    Loader2,
    Eye,
    UserMinus,
    UserCheck,
    GraduationCap
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { StudentForm } from "./StudentForm";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateProfileStatusAction, deleteProfileAction } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { StudentColumn } from "./columns";
import { sendApprovalNotification } from "@/lib/notifications";

interface StudentActionsProps {
    student: StudentColumn;
}

export function StudentActions({ student }: StudentActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const router = useRouter();

    const updateStatus = async (status: 'approved' | 'rejected') => {
        setLoading(true);
        const res = await updateProfileStatusAction(student.id, status);

        if (res.error) {
            toast.error(res.error);
            setLoading(false);
            return;
        }

        if (status === 'approved') {
            await sendApprovalNotification(student.email || '', student.full_name);
        }

        toast.success(`Student ${status} successfully.`);
        setLoading(false);
        router.refresh();
    };

    const deleteStudent = async () => {
        if (!confirm("Are you sure you want to delete this student profile? This action is irreversible.")) return;

        setLoading(true);
        const res = await deleteProfileAction(student.id);

        if (res.error) {
            toast.error(res.error);
            setLoading(false);
            return;
        }

        toast.success("Student profile removed.");
        setLoading(false);
        router.refresh();
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/50 rounded-lg">
                        <span className="sr-only">Open menu</span>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MoreHorizontal className="h-4 w-4 text-slate-400" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl bg-card border-border shadow-2xl p-2 gap-1 flex flex-col">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 px-3 py-2">
                        Institutional Governance
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                        onClick={() => setShowProfile(true)}
                        className="font-bold cursor-pointer py-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Eye className="mr-3 h-4 w-4 text-indigo-500" /> View Full Profile
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-100" />

                    <DropdownMenuItem
                        onClick={() => setShowEditDialog(true)}
                        className="font-bold cursor-pointer py-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Pencil className="mr-3 h-4 w-4 text-amber-500" /> Modify Registration
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-100" />

                    {student.status === 'pending' && (
                        <>
                            <DropdownMenuItem
                                onClick={() => updateStatus('approved')}
                                disabled={loading}
                                className="text-emerald-600 focus:text-emerald-500 focus:bg-emerald-50 font-bold cursor-pointer py-3 rounded-xl transition-colors"
                            >
                                <UserCheck className="mr-3 h-4 w-4" /> Finalize Enrollment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateStatus('rejected')}
                                disabled={loading}
                                className="text-orange-600 focus:text-orange-500 focus:bg-orange-50 font-bold cursor-pointer py-3 rounded-xl transition-colors"
                            >
                                <UserMinus className="mr-3 h-4 w-4" /> Reject Status
                            </DropdownMenuItem>
                        </>
                    )}

                    {student.status === 'approved' && (
                        <DropdownMenuItem
                            onClick={() => updateStatus('rejected')}
                            disabled={loading}
                            className="text-orange-600 focus:text-orange-500 focus:bg-orange-50 font-bold cursor-pointer py-3 rounded-xl transition-colors"
                        >
                            <X className="mr-3 h-4 w-4" /> Suspend Credentials
                        </DropdownMenuItem>
                    )}

                    {student.status === 'rejected' && (
                        <DropdownMenuItem
                            onClick={() => updateStatus('approved')}
                            disabled={loading}
                            className="text-emerald-600 focus:text-emerald-500 focus:bg-emerald-50 font-bold cursor-pointer py-3 rounded-xl transition-colors"
                        >
                            <Check className="mr-3 h-4 w-4" /> Reinstate Status
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        onClick={() => {
                            navigator.clipboard.writeText(student.id);
                            toast.success("Student ID copied");
                        }}
                        className="font-semibold cursor-pointer py-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Copy className="mr-3 h-4 w-4 text-slate-400" /> Duplicate UID
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-100" />

                    <DropdownMenuItem
                        onClick={deleteStudent}
                        disabled={loading}
                        className="text-rose-600 focus:text-rose-500 focus:bg-rose-50 font-bold cursor-pointer py-3 rounded-xl transition-colors"
                    >
                        <Trash2 className="mr-3 h-4 w-4" /> Purge Records
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showProfile} onOpenChange={setShowProfile}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-4 shadow-3xl p-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
                    <DialogHeader className="relative z-10 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                                <GraduationCap className="w-8 h-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black font-outfit uppercase tracking-tight text-slate-900">
                                    {student.full_name}
                                </DialogTitle>
                                <DialogDescription className="font-bold text-primary uppercase tracking-[0.2em] text-[10px]">
                                    Institutional Academic Record
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-8 py-8 relative z-10">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Email</p>
                                <p className="text-sm font-bold text-slate-800">{student.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Grade</p>
                                <p className="text-sm font-bold text-slate-800">{student.grade_level}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Institution</p>
                                <p className="text-sm font-bold text-slate-800">{student.school_name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Director</p>
                                <p className="text-sm font-bold text-slate-800">{student.teacher_name}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Contact</p>
                                <p className="text-sm font-bold text-slate-800">{student.phone}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Father's Name</p>
                                <p className="text-sm font-bold text-slate-800">{student.father_name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mother's Name</p>
                                <p className="text-sm font-bold text-slate-800">{student.mother_name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Date</p>
                                <p className="text-sm font-bold text-slate-800">{new Date(student.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex justify-end relative z-10">
                        <Button
                            onClick={() => setShowProfile(false)}
                            className="bg-slate-900 hover:bg-black text-white rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]"
                        >
                            Close Record
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-xl rounded-[2rem] border-2 border-border bg-card shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black font-outfit text-gradient">Edit Student Details</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Update profile information for {student.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <StudentForm
                        initialData={student}
                        onSuccess={() => setShowEditDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
