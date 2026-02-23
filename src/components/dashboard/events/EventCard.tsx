"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ScrollText, Users, Send, CheckCircle2, Info, ArrowRight, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createNotificationAction } from "@/app/actions/notifications";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

interface EventCardProps {
    event: any;
    role: 'school_admin' | 'teacher' | 'student';
}

export function EventCard({ event, role }: EventCardProps) {
    const [loading, setLoading] = useState(false);

    const onInform = async () => {
        setLoading(true);
        try {
            const recipientRole = role === 'school_admin' ? 'teacher' : 'student';
            const message = role === 'school_admin'
                ? `Attention Teachers: A new competition "${event.title}" has been launched. Please review the guidelines and prepare your students.`
                : `Attention Students: You are invited to participate in "${event.title}". Check the rules and submit your entries!`;

            const result = await createNotificationAction({
                title: `New Event: ${event.title}`,
                message: message,
                type: 'event_alert',
                recipient_role: recipientRole,
                event_id: event.id
            });

            if (result.error) throw new Error(result.error);
            toast.success(role === 'school_admin' ? "Teachers informed successfully!" : "Students informed successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send notification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="group overflow-hidden border-2 border-slate-100 hover:border-indigo-100 transition-all duration-300 shadow-sm hover:shadow-xl rounded-[2rem] bg-white">
            <div className="relative aspect-video overflow-hidden">
                {event.banner_url ? (
                    <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <ScrollText className="w-12 h-12 text-slate-300" />
                    </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className="bg-white/90 backdrop-blur text-slate-900 border-none shadow-sm font-black uppercase text-[9px] tracking-widest px-3 py-1 self-start">
                        {event.media_type}
                    </Badge>
                    {event.is_private && (
                        <Badge className="bg-red-600/90 backdrop-blur text-white border-none shadow-sm font-black uppercase text-[9px] tracking-widest px-3 py-1 self-start flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Private • {event.schools?.name || "Targeted School"}
                        </Badge>
                    )}
                </div>
            </div>

            <CardHeader className="p-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(event.start_date), "dd MMM")} - {format(new Date(event.end_date), "dd MMM yyyy")}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-0">
                <div
                    className="text-sm text-slate-500 line-clamp-2 leading-relaxed h-10 mb-6"
                    dangerouslySetInnerHTML={{ __html: event.description || "" }}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest h-10 hover:bg-slate-50">
                                <Info className="w-3.5 h-3.5 mr-2" /> Details
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] rounded-[2rem] border-4 p-0 overflow-hidden">
                            <div className="max-h-[85vh] overflow-y-auto">
                                <div className="relative h-60">
                                    {event.banner_url && (
                                        <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-6 left-8 right-8">
                                        <h2 className="text-4xl font-black text-white uppercase font-outfit tracking-tight">{event.title}</h2>
                                    </div>
                                </div>
                                <div className="p-10 space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Duration</p>
                                            <p className="text-sm font-bold text-indigo-900">
                                                {format(new Date(event.start_date), "PPP")} - {format(new Date(event.end_date), "PPP")}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</p>
                                            <Badge className="bg-emerald-500 text-white border-none uppercase text-[9px] font-black px-3">
                                                {event.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 underline decoration-indigo-200 decoration-4 underline-offset-4">Guidelines & Rules</h4>
                                        <div
                                            className="text-slate-600 leading-relaxed text-sm prose prose-indigo max-w-none"
                                            dangerouslySetInnerHTML={{ __html: event.full_rules || "" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {role !== 'student' && (
                        <Button
                            onClick={onInform}
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest h-10 shadow-lg shadow-indigo-100"
                        >
                            {loading ? (
                                <Send className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                                <>{role === 'school_admin' ? 'Inform Teachers' : 'Inform Students'} <ArrowRight className="ml-2 w-3.5 h-3.5" /></>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
