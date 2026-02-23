"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hammer, UserCheck } from "lucide-react";

export type JudgeColumn = {
    id: string;
    full_name: string;
    email: string;
    expertise: string;
    status: string;
    created_at: string;
};

export const columns: ColumnDef<JudgeColumn>[] = [
    {
        accessorKey: "full_name",
        header: "Full Name",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "expertise",
        header: "Expertise",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge
                    variant={status === "approved" ? "default" : "secondary"}
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
            return (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Hammer className="h-4 w-4" /> Assignments
                    </Button>
                </div>
            );
        },
    },
];
