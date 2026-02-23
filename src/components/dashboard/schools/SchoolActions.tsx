"use client";

import { useState } from "react";
import {
    Check,
    X,
    MoreHorizontal,
    Eye,
    Trash2,
    Copy,
    Pencil,
    Key,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { sendApprovalNotification } from "@/lib/notifications";
import { SchoolColumn } from "./columns";
import { SchoolDetailsModal } from "./SchoolDetailsModal";
import { SchoolForm } from "./SchoolForm";

interface SchoolActionsProps {
    school: SchoolColumn;
}

export function SchoolActions({ school }: SchoolActionsProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const updateStatus = async (status: 'approved' | 'rejected') => {
        setLoading(true);
        const { error } = await supabase
            .from("schools")
            .update({ status })
            .eq("id", school.id);

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        if (status === 'approved') {
            // Update the profile of the person who registered the school
            // This ensures they are promoted to school_admin and linked to the school
            await supabase
                .from("profiles")
                .update({
                    status: 'approved',
                    role: 'school_admin',
                    school_id: school.id
                })
                .eq("email", school.admin_email);

            await sendApprovalNotification(school.admin_email, school.name);
            toast.success(`School approved and admin activated!`);
        } else if (status === 'rejected') {
            // If we are rejecting an already approved school, we should probably set the admin back to pending
            await supabase
                .from("profiles")
                .update({ status: 'pending' })
                .eq("email", school.admin_email);

            toast.success(`School disapproved and admin access revoked.`);
        }

        setLoading(false);
        router.refresh();
    };

    const handleResendCredentials = async () => {
        setResending(true);
        try {
            const response = await fetch("/api/admin/resend-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: school.admin_email }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            toast.success("Activation email sent successfully!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setResending(false);
        }
    };

    const handleEditSuccess = () => {
        setIsEditOpen(false);
        router.refresh();
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone and will affect all associated data.`)) {
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from("schools")
                .delete()
                .eq("id", school.id);

            if (error) throw error;

            toast.success("School deleted successfully");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete school");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {school.status === 'pending' && (
                <>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                        onClick={() => updateStatus('approved')}
                        disabled={loading}
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        onClick={() => updateStatus('rejected')}
                        disabled={loading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </>
            )}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 transition-all rounded-lg">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px] rounded-xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-100">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-1.5">Management</DropdownMenuLabel>

                        <DropdownMenuItem
                            onClick={() => setIsDetailsOpen(true)}
                            className="rounded-lg flex items-center gap-2 px-2 py-2 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 focus:bg-indigo-50 focus:text-indigo-600 transition-colors cursor-pointer"
                        >
                            <Eye className="w-4 h-4" /> View Details
                        </DropdownMenuItem>

                        <DialogTrigger asChild>
                            <DropdownMenuItem
                                className="rounded-lg flex items-center gap-2 px-2 py-2 text-sm font-medium hover:bg-slate-50 focus:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" /> Edit School
                            </DropdownMenuItem>
                        </DialogTrigger>

                        <DropdownMenuItem
                            onClick={handleResendCredentials}
                            disabled={resending}
                            className="rounded-lg flex items-center gap-2 px-2 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 focus:bg-amber-50 transition-colors cursor-pointer"
                        >
                            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                            Resend Access
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-slate-100" />

                        {school.status === 'approved' && (
                            <DropdownMenuItem
                                onClick={() => updateStatus('rejected')}
                                className="rounded-lg flex items-center gap-2 px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" /> Disapprove
                            </DropdownMenuItem>
                        )}

                        {school.status === 'rejected' && (
                            <DropdownMenuItem
                                onClick={() => updateStatus('approved')}
                                className="rounded-lg flex items-center gap-2 px-2 py-2 text-sm font-medium text-green-600 hover:bg-green-50 focus:bg-green-50 transition-colors cursor-pointer"
                            >
                                <Check className="w-4 h-4" /> Re-approve
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(school.id);
                                toast.success("School ID copied!");
                            }}
                            className="rounded-lg flex items-center gap-2 px-2 py-2 text-sm font-medium transition-colors cursor-pointer"
                        >
                            <Copy className="w-4 h-4" /> Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            disabled={loading}
                            className="rounded-lg flex items-center gap-2 px-2 py-2 text-sm font-medium text-destructive hover:bg-red-50 focus:bg-red-50 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" /> Delete School
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Institutional Data</DialogTitle>
                        <DialogDescription>
                            Update information for {school.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <SchoolForm initialData={school} onSuccess={handleEditSuccess} />
                </DialogContent>
            </Dialog>

            <SchoolDetailsModal
                school={school}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    );
}
