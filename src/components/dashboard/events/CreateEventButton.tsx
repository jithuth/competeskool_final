"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { EventForm } from "./EventForm";

export function CreateEventButton() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                    <Plus className="mr-2 h-5 w-5" /> Launch Competition
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1400px] w-[95vw] max-w-none rounded-[2rem] border-4 shadow-2xl p-10 max-h-[95vh] bg-white border-slate-100/50 overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-black font-outfit uppercase tracking-tight">Launch New Event</DialogTitle>
                    <DialogDescription className="font-medium text-slate-500 italic">
                        Initialize a new institutional competition phase.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <EventForm onSuccess={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
