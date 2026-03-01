"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { EventActions } from "./EventActions";
import { format } from "date-fns";

export type EventColumn = {
    id: string;
    title: string;
    status: string;
    results_status: string;
    start_date: string;
    end_date: string;
};

const RESULTS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    not_started: { label: "Not Started", color: "bg-slate-100 text-slate-500" },
    scoring_open: { label: "Scoring Open", color: "bg-blue-100 text-blue-700" },
    scoring_locked: { label: "Locked", color: "bg-amber-100 text-amber-700" },
    review: { label: "In Review", color: "bg-purple-100 text-purple-700" },
    published: { label: "Published", color: "bg-emerald-100 text-emerald-700" },
};

export const columns: ColumnDef<EventColumn>[] = [
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
            <span className="font-bold text-slate-900 max-w-[200px] truncate block">
                {row.getValue("title")}
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Event Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge className={`capitalize rounded-full text-[9px] font-black uppercase tracking-widest px-3 ${status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "results_status",
        header: "Results",
        cell: ({ row }) => {
            const rs = (row.getValue("results_status") as string) || "not_started";
            const cfg = RESULTS_STATUS_CONFIG[rs] || RESULTS_STATUS_CONFIG.not_started;
            return (
                <Badge className={`rounded-full text-[9px] font-black uppercase tracking-widest px-3 ${cfg.color}`}>
                    {cfg.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: "start_date",
        header: "Start",
        cell: ({ row }) => {
            const date = new Date(row.getValue("start_date"));
            return <span className="text-xs text-slate-500 font-medium">{format(date, "dd MMM yyyy")}</span>;
        },
    },
    {
        accessorKey: "end_date",
        header: "End",
        cell: ({ row }) => {
            const date = new Date(row.getValue("end_date"));
            return <span className="text-xs text-slate-500 font-medium">{format(date, "dd MMM yyyy")}</span>;
        },
    },
    {
        id: "actions",
        header: "Operations",
        cell: ({ row }) => <EventActions data={row.original} />,
    },
];
