"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { sendBulkEventEmailAction, getApprovedSchoolsAction } from "@/app/actions/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BroadcastDialogProps {
    event: any;
    isOpen: boolean;
    onClose: () => void;
}

export function BroadcastDialog({ event, isOpen, onClose }: BroadcastDialogProps) {
    const [loading, setLoading] = useState(false);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
    const [fetchingSchools, setFetchingSchools] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSchools();
        }
    }, [isOpen]);

    const fetchSchools = async () => {
        setFetchingSchools(true);
        try {
            const res = await getApprovedSchoolsAction();
            if (res.data) {
                setSchools(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch schools", error);
        } finally {
            setFetchingSchools(false);
        }
    };

    const onBroadcastTargeted = async () => {
        try {
            setLoading(true);
            const result = await sendBulkEventEmailAction(event.id, selectedSchools.length > 0 ? selectedSchools : undefined);
            if (result.error) throw new Error(result.error);
            toast.success(`Broadcasting invitation to ${result.count} school admins!`);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to send broadcast.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSchool = (id: string) => {
        setSelectedSchools(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedSchools(schools.map(s => s.$id));
        } else {
            setSelectedSchools([]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="rounded-[2.5rem] border-4 shadow-2xl max-w-lg p-10">
                <DialogHeader className="space-y-4">
                    <DialogTitle className="font-outfit font-black text-3xl uppercase tracking-tight text-slate-900 flex items-center gap-3">
                        <Mail className="w-8 h-8 text-primary" /> Broadcast
                    </DialogTitle>
                    <DialogDescription className="font-medium text-slate-500 text-base leading-relaxed">
                        Send automated email invitations for <span className="font-bold text-slate-900">"{event.title}"</span> to institution administrators.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 py-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient Schools</label>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedSchools.length === schools.length && schools.length > 0}
                                    onCheckedChange={(checked) => toggleAll(!!checked)}
                                />
                                <label htmlFor="select-all" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 cursor-pointer">Select All</label>
                            </div>
                        </div>

                        <ScrollArea className="h-[250px] pr-4">
                            {fetchingSchools ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {schools.map((school) => (
                                        <div
                                            key={school.$id}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedSchools.includes(school.$id)
                                                    ? "bg-primary/5 border-primary/20"
                                                    : "bg-slate-50 border-transparent hover:border-slate-200"
                                                }`}
                                            onClick={() => toggleSchool(school.$id)}
                                        >
                                            <Checkbox
                                                checked={selectedSchools.includes(school.$id)}
                                                onCheckedChange={() => toggleSchool(school.$id)}
                                            />
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-800">{school.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{school.address || "No Address Provided"}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {schools.length === 0 && (
                                        <p className="text-center text-slate-400 py-10 font-medium">No approved schools found.</p>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="bg-indigo-50/50 p-6 rounded-3xl border-2 border-indigo-100/50 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                            <Check className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Broadcast Summary</p>
                            <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                {selectedSchools.length === 0
                                    ? "By default, invitations will be sent to ALL institutional administrators."
                                    : `Targeting ${selectedSchools.length} specific school(s) for this broadcast session.`}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 flex !justify-between items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs hover:bg-slate-100"
                    >
                        Abort
                    </Button>
                    <Button
                        disabled={loading || fetchingSchools}
                        onClick={onBroadcastTargeted}
                        className="bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs h-14 px-10 shadow-xl shadow-slate-200"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Mail className="w-5 h-5 mr-3" />}
                        Execute Broadcast
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
