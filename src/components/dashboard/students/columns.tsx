"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

import { StudentActions } from "./StudentActions";

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
        cell: ({ row }) => <StudentActions student={row.original} />,
    },
];
