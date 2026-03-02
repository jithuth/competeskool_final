"use client";

import { useState } from "react";
import {
    Pencil,
    Check,
    X,
    MoreHorizontal,
    Trash2,
    Copy,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TeacherForm } from "./TeacherForm";

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
import { TeacherColumn } from "./columns";

interface TeacherActionsProps {
    teacher: TeacherColumn;
    isSuperAdmin?: boolean;
    schools?: { id: string, name: string }[];
}

export function TeacherActions({ teacher, isSuperAdmin, schools }: TeacherActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const updateStatus = async (status: 'approved' | 'rejected') => {
        setLoading(true);
        const { error } = await supabase
            .from("profiles")
            .update({ status })
            .eq("id", teacher.id);

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        toast.success(`Teacher ${status === 'approved' ? 'approved' : 'disapproved'} successfully.`);
        setLoading(false);
        router.refresh();
    };

    const deleteTeacher = async () => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;

        setLoading(true);

        const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("id", teacher.id);

        if (error) {
            toast.error("Failed to delete the teacher. Please refer to support if issue persists.");
            setLoading(false);
            return;
        }

        toast.success("Teacher removed.");
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
                        Institutional Control
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setShowEditDialog(true)}
                        className="font-bold cursor-pointer py-3 rounded-xl mx-1"
                    >
                        <Pencil className="mr-3 h-4 w-4 text-primary" /> Edit Profile
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {teacher.status !== 'approved' && (
                        <DropdownMenuItem
                            onClick={() => updateStatus('approved')}
                            disabled={loading}
                            className="text-emerald-500 focus:text-emerald-400 focus:bg-emerald-500/10 font-bold cursor-pointer py-3 rounded-xl mx-1"
                        >
                            <Check className="mr-3 h-4 w-4" /> Approve Instructor
                        </DropdownMenuItem>
                    )}

                    {teacher.status === 'approved' && (
                        <DropdownMenuItem
                            onClick={() => updateStatus('rejected')}
                            disabled={loading}
                            className="text-amber-500 focus:text-amber-400 focus:bg-amber-500/10 font-bold cursor-pointer py-3 rounded-xl mx-1"
                        >
                            <X className="mr-3 h-4 w-4" /> Suspend Access
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        onClick={() => {
                            navigator.clipboard.writeText(teacher.id);
                            toast.success("Teacher ID copied");
                        }}
                        className="font-semibold cursor-pointer py-3 rounded-xl mx-1"
                    >
                        <Copy className="mr-3 h-4 w-4 text-slate-500" /> Copy Account ID
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={deleteTeacher}
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
                        <DialogTitle className="text-2xl font-black font-outfit text-gradient">Edit Teacher Profile</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Update institutional details for {teacher.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <TeacherForm
                        initialData={teacher}
                        isSuperAdmin={isSuperAdmin}
                        schools={schools}
                        onSuccess={() => setShowEditDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
