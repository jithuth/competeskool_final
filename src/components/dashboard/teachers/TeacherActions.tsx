"use client";

import { useState } from "react";
import {
    Check,
    X,
    MoreHorizontal,
    Trash2,
    Copy,
    Loader2
} from "lucide-react";
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
}

export function TeacherActions({ teacher }: TeacherActionsProps) {
    const [loading, setLoading] = useState(false);
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="sr-only">Open menu</span>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Management
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {teacher.status !== 'approved' && (
                    <DropdownMenuItem
                        onClick={() => updateStatus('approved')}
                        disabled={loading}
                        className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 font-semibold cursor-pointer py-2.5"
                    >
                        <Check className="mr-2 h-4 w-4" /> Approve Access
                    </DropdownMenuItem>
                )}

                {teacher.status === 'approved' && (
                    <DropdownMenuItem
                        onClick={() => updateStatus('rejected')}
                        disabled={loading}
                        className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 font-semibold cursor-pointer py-2.5"
                    >
                        <X className="mr-2 h-4 w-4" /> Revoke Access
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    onClick={() => {
                        navigator.clipboard.writeText(teacher.id);
                        toast.success("Teacher ID copied to clipboard");
                    }}
                    className="font-semibold cursor-pointer py-2.5"
                >
                    <Copy className="mr-2 h-4 w-4 text-slate-400" /> Copy ID
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={deleteTeacher}
                    disabled={loading}
                    className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-bold cursor-pointer py-2.5"
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
