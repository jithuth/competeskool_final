"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, User } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { sendApprovalNotification } from "@/lib/notifications";

export type StudentColumn = {
    id: string;
    full_name: string;
    email: string;
    status: string;
    grade_level: string;
    school_name?: string;
    teacher_name?: string;
    created_at: string;
};

export const columns: ColumnDef<StudentColumn>[] = [
    {
        accessorKey: "full_name",
        header: "Full Name",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "school_name",
        header: "School",
    },
    {
        accessorKey: "teacher_name",
        header: "Class Teacher",
    },
    {
        accessorKey: "grade_level",
        header: "Grade",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge
                    variant={
                        status === "approved"
                            ? "default"
                            : status === "pending"
                                ? "secondary"
                                : "destructive"
                    }
                    className="capitalize"
                >
                    {status}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const student = row.original;
            const supabase = createClient();
            const router = useRouter();

            const updateStatus = async (status: 'approved' | 'rejected') => {
                const { error } = await supabase
                    .from("profiles")
                    .update({ status })
                    .eq("id", student.id);

                if (error) {
                    toast.error(error.message);
                    return;
                }

                if (status === 'approved') {
                    await sendApprovalNotification(student.email || '', student.full_name);
                }
                toast.success(`Student ${status}!`);
                router.refresh();
            };

            return (
                <div className="flex items-center gap-2">
                    {student.status === 'pending' && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                onClick={() => updateStatus('approved')}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                            >
                                <X className="h-4 w-4" onClick={() => updateStatus('rejected')} />
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <User className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
];
