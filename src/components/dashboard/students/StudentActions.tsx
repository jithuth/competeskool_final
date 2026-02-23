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
    UserCheck
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
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { StudentColumn } from "./columns";
import { sendApprovalNotification } from "@/lib/notifications";

interface StudentActionsProps {
    student: StudentColumn;
}

export function StudentActions({ student }: StudentActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const updateStatus = async (status: 'approved' | 'rejected') => {
        setLoading(true);
        const { error } = await supabase
            .from("profiles")
            .update({ status })
            .eq("id", student.id);

        if (error) {
            toast.error(error.message);
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

        const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("id", student.id);

        if (error) {
            toast.error("Failed to delete the profile.");
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
                <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-card border-border shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                        Student Controls
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setShowEditDialog(true)}
                        className="font-bold cursor-pointer py-3 rounded-xl mx-1"
                    >
                        <Pencil className="mr-3 h-4 w-4 text-primary" /> Edit Profile
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {student.status === 'pending' && (
                        <>
                            <DropdownMenuItem
                                onClick={() => updateStatus('approved')}
                                disabled={loading}
                                className="text-emerald-500 focus:text-emerald-400 focus:bg-emerald-500/10 font-bold cursor-pointer py-3 rounded-xl mx-1"
                            >
                                <UserCheck className="mr-3 h-4 w-4" /> Approve Enrollment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateStatus('rejected')}
                                disabled={loading}
                                className="text-amber-500 focus:text-amber-400 focus:bg-amber-500/10 font-bold cursor-pointer py-3 rounded-xl mx-1"
                            >
                                <UserMinus className="mr-3 h-4 w-4" /> Reject Enrollment
                            </DropdownMenuItem>
                        </>
                    )}

                    {student.status === 'approved' && (
                        <DropdownMenuItem
                            onClick={() => updateStatus('rejected')}
                            disabled={loading}
                            className="text-amber-500 focus:text-amber-400 focus:bg-amber-500/10 font-bold cursor-pointer py-3 rounded-xl mx-1"
                        >
                            <X className="mr-3 h-4 w-4" /> Suspend Access
                        </DropdownMenuItem>
                    )}

                    {student.status === 'rejected' && (
                        <DropdownMenuItem
                            onClick={() => updateStatus('approved')}
                            disabled={loading}
                            className="text-emerald-500 focus:text-emerald-400 focus:bg-emerald-500/10 font-bold cursor-pointer py-3 rounded-xl mx-1"
                        >
                            <Check className="mr-3 h-4 w-4" /> Restore Access
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        onClick={() => {
                            navigator.clipboard.writeText(student.id);
                            toast.success("Student ID copied");
                        }}
                        className="font-semibold cursor-pointer py-3 rounded-xl mx-1"
                    >
                        <Copy className="mr-3 h-4 w-4 text-slate-500" /> Copy Unique ID
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={deleteStudent}
                        disabled={loading}
                        className="text-rose-500 focus:text-rose-400 focus:bg-rose-500/10 font-bold cursor-pointer py-3 rounded-xl mx-1"
                    >
                        <Trash2 className="mr-3 h-4 w-4" /> Permanent Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
