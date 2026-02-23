"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SchoolActions } from "./SchoolActions";

export type SchoolColumn = {
    id: string;
    name: string;
    address: string;
    status: string;
    admin_email: string;
    logo_url?: string;
    created_at: string;
};

export const columns: ColumnDef<SchoolColumn>[] = [
    {
        accessorKey: "name",
        header: "School Name",
    },
    {
        accessorKey: "address",
        header: "Location",
    },
    {
        accessorKey: "admin_email",
        header: "Admin Email",
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
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
        id: "actions",
        cell: ({ row }) => <SchoolActions school={row.original} />,
    },
];
