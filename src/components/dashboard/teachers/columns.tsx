"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { TeacherActions } from "./TeacherActions";

export type TeacherColumn = {
    id: string;
    full_name: string;
    email: string;
    school_name?: string;
    class_section: string;
    status: string;
    created_at: string;
};

interface GetColumnsProps {
    isSuperAdmin?: boolean;
    schools?: { id: string, name: string }[];
}

export const getColumns = ({ isSuperAdmin, schools }: GetColumnsProps): ColumnDef<TeacherColumn>[] => [
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
        accessorKey: "class_section",
        header: "Class & Section",
        cell: ({ row }) => row.getValue("class_section") || "N/A",
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
        cell: ({ row }) => <TeacherActions teacher={row.original} isSuperAdmin={isSuperAdmin} schools={schools} />,
    },
];
