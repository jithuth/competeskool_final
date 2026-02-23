"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { EventActions } from "./EventActions";
import { format } from "date-fns";

export type EventColumn = {
    id: string;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
};

export const columns: ColumnDef<EventColumn>[] = [
    {
        accessorKey: "title",
        header: "Title",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant={status === 'active' ? 'default' : 'secondary'} className="capitalize bg-slate-100 text-slate-900 border-slate-200">
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "start_date",
        header: "Start Date",
        cell: ({ row }) => {
            const date = new Date(row.getValue("start_date"));
            return format(date, "dd MMM yyyy");
        },
    },
    {
        accessorKey: "end_date",
        header: "End Date",
        cell: ({ row }) => {
            const date = new Date(row.getValue("end_date"));
            return format(date, "dd MMM yyyy");
        },
    },
    {
        id: "actions",
        header: "Operations",
        cell: ({ row }) => <EventActions data={row.original} />,
    },
];
