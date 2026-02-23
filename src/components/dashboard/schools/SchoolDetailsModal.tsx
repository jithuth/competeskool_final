"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    School as SchoolIcon,
    Mail,
    MapPin,
    Calendar,
    Users,
    GraduationCap,
    ShieldCheck,
    AlertCircle,
    Building2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { SchoolColumn } from "./columns";

interface SchoolDetailsModalProps {
    school: SchoolColumn;
    isOpen: boolean;
    onClose: () => void;
}

export function SchoolDetailsModal({ school, isOpen, onClose }: SchoolDetailsModalProps) {
    const [stats, setStats] = useState({ teachers: 0, students: 0 });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && school.id) {
            async function fetchStats() {
                setLoading(true);

                // Get teacher count
                const { count: teacherCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .eq("school_id", school.id)
                    .eq("role", "teacher");

                // Get student count
                const { count: studentCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .eq("school_id", school.id)
                    .eq("role", "student");

                setStats({
                    teachers: teacherCount || 0,
                    students: studentCount || 0
                });
                setLoading(false);
            }
            fetchStats();
        }
    }, [isOpen, school.id, supabase]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl overflow-hidden p-0 rounded-[2rem] border-0 shadow-2xl">
                <div className="bg-primary p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl overflow-hidden shrink-0">
                            {school.logo_url ? (
                                <img src={school.logo_url} alt={`${school.name} logo`} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black font-outfit tracking-tight text-white">{school.name}</DialogTitle>
                                <DialogDescription className="sr-only">
                                    School details and statistics
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm capitalize px-3">
                                    {school.status}
                                </Badge>
                                <span className="text-white/60 text-xs font-medium uppercase tracking-widest flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Institution
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-white">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Details</p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Address</p>
                                            <p className="text-sm font-semibold text-slate-900">{school.address || "No address provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Admin Email</p>
                                            <p className="text-sm font-semibold text-slate-900">{school.admin_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Registration Date</p>
                                            <p className="text-sm font-semibold text-slate-900">{new Date(school.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Enrollment Stats</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Users className="w-4 h-4 text-primary" />
                                            {loading ? <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /> : null}
                                        </div>
                                        <p className="text-2xl font-black text-slate-900">{loading ? "..." : stats.teachers}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Teachers</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <GraduationCap className="w-4 h-4 text-purple-600" />
                                            {loading ? <div className="w-4 h-4 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" /> : null}
                                        </div>
                                        <p className="text-2xl font-black text-slate-900">{loading ? "..." : stats.students}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Students</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-blue-900 uppercase">Security Note</p>
                                    <p className="text-[10px] text-blue-700 font-medium">Any changes to school status will affect all associated user permissions and platform access.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
