"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash, Eye, Loader2, Share2, Mail, ClipboardList, Trophy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendBulkEventEmailAction } from "@/app/actions/admin";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EventForm } from "./EventForm";

interface EventActionsProps {
    data: any;
}

export function EventActions({ data }: EventActionsProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const onShare = async () => {
        const url = `${window.location.origin}/competitions/${data.id}`;
        await navigator.clipboard.writeText(url);
        toast.success("Event link copied to clipboard!");
    };

    const onBulkEmail = async () => {
        try {
            setLoading(true);
            const result = await sendBulkEventEmailAction(data.id);
            if (result.error) throw new Error(result.error);
            toast.success(`Broadcasting invitation to ${result.count} schools!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to send bulk emails.");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from("events")
                .delete()
                .eq("id", data.id);

            if (error) throw error;

            router.refresh();
            toast.success("Competition deleted successfully.");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete competition.");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-2xl border-2">
                    <DialogHeader>
                        <DialogTitle className="font-outfit font-black text-2xl uppercase tracking-tight text-red-600">Sensitive Action</DialogTitle>
                        <DialogDescription className="font-medium">
                            This cannot be undone. Permanent deletion of
                            <span className="font-bold text-slate-900 mx-1">"{data.title}"</span>
                            will remove all entry data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={loading}
                            onClick={onDelete}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-6"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[1400px] w-[95vw] max-w-none rounded-[2rem] border-4 shadow-2xl p-10 max-h-[95vh] bg-white border-slate-100/50 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black font-outfit uppercase tracking-tight">Modify Competition</DialogTitle>
                        <DialogDescription className="font-medium">Update the details, rules, or schedule for {data.title}.</DialogDescription>
                    </DialogHeader>
                    <EventForm initialData={data} onSuccess={() => setEditOpen(false)} />
                </DialogContent>
            </Dialog>

            <Link href={`/dashboard/events/${data.id}/scoring`}>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
                >
                    <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Evaluate
                </Button>
            </Link>

            {data.results_status === "published" && (
                <Link href={`/events/${data.id}/results`} target="_blank">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-amber-100 bg-amber-50/50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
                    >
                        <Trophy className="w-3.5 h-3.5 mr-1.5" /> Results
                    </Button>
                </Link>
            )}

            <Button
                size="sm"
                variant="outline"
                onClick={onShare}
                className="h-8 rounded-lg border-blue-100 bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
            >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
            </Button>

            <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={onBulkEmail}
                className="h-8 rounded-lg border-emerald-100 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
            >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />} Broadcast
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl border-2 shadow-xl p-2 gap-1 flex flex-col">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 py-1.5">Settings & Privacy</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => window.open(`/competitions/${data.id}`, '_blank')}
                        className="rounded-xl flex items-center gap-3 py-2.5 font-bold text-xs cursor-pointer hover:bg-slate-50"
                    >
                        <Eye className="w-4 h-4 text-indigo-500" /> View Public Page
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setEditOpen(true)}
                        className="rounded-xl flex items-center gap-3 py-2.5 font-bold text-xs cursor-pointer hover:bg-slate-50"
                    >
                        <Edit className="w-4 h-4 text-amber-500" /> Modify Launcher
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem
                        onClick={() => setOpen(true)}
                        className="rounded-xl flex items-center gap-3 py-2.5 font-bold text-xs cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
                    >
                        <Trash className="w-4 h-4" /> Terminate Event
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
