"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { createJudgeAction, updateJudgeAction, deleteJudgeAction } from "@/app/actions/evaluation";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, UserCheck, Mail, Briefcase, FileText, Lock, Shield, Activity, Eye, EyeOff } from "lucide-react";

interface Judge {
    id: string;
    full_name: string;
    email: string;
    status: string;
    expertise: string;
    bio: string;
    created_at: string;
    assignedEvents?: number;
    scoredCount?: number;
}

function AddJudgeDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ full_name: "", email: "", password: "", expertise: "", bio: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.password) {
            toast.error("Name, email, and password are required");
            return;
        }
        setLoading(true);
        const res = await createJudgeAction(form);
        setLoading(false);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Judge created successfully");
        setOpen(false);
        setForm({ full_name: "", email: "", password: "", expertise: "", bio: "" });
        onSuccess();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-indigo-600 font-black uppercase tracking-widest text-xs gap-2 transition-all shadow-xl">
                    <Plus className="w-4 h-4" /> Induct Judge
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black font-outfit">Induct New Judge</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><UserCheck className="w-3 h-3" /> Full Name</Label>
                        <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Dr. Priya Mehta" className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</Label>
                        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="judge@institution.com" className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Temporary Password</Label>
                        <div className="relative">
                            <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="h-12 rounded-xl pr-10" required minLength={6} />
                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> Expertise / Domain</Label>
                        <Input value={form.expertise} onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))} placeholder="e.g. Fine Arts, Technology, Music" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Bio / Credentials</Label>
                        <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Brief professional background..." className="rounded-xl min-h-[80px] resize-none" rows={3} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 font-black uppercase tracking-widest text-xs transition-all">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                        Induct to Panel
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditJudgeDialog({ judge, onSuccess }: { judge: Judge; onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ full_name: judge.full_name, expertise: judge.expertise, bio: judge.bio, status: judge.status });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await updateJudgeAction({ id: judge.id, ...form });
        setLoading(false);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Judge updated");
        setOpen(false);
        onSuccess();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-indigo-50 hover:text-indigo-600">
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black font-outfit">Edit Judge</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                        <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expertise</Label>
                        <Input value={form.expertise} onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bio</Label>
                        <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="rounded-xl min-h-[80px]" rows={3} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</Label>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium">
                            <option value="approved">Approved</option>
                            <option value="pending">Suspended</option>
                        </select>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-slate-900 font-black uppercase text-xs tracking-widest">
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Changes
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function JudgesManager({ initialJudges }: { initialJudges: Judge[] }) {
    const [judges, setJudges] = useState<Judge[]>(initialJudges);
    const [deleting, setDeleting] = useState<string | null>(null);
    const router = useRouter();

    const refresh = () => router.refresh();

    const handleDelete = async (id: string) => {
        setDeleting(id);
        const res = await deleteJudgeAction(id);
        setDeleting(null);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Judge removed from panel");
        refresh();
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black font-outfit uppercase tracking-tight">
                        Judges <span className="text-primary italic">Panel</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
                        {judges.length} Active Evaluators · Full Circuit Authority
                    </p>
                </div>
                <AddJudgeDialog onSuccess={refresh} />
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Judges", value: judges.length, icon: UserCheck, color: "indigo" },
                    { label: "Active", value: judges.filter(j => j.status === "approved").length, icon: Activity, color: "emerald" },
                    { label: "Suspended", value: judges.filter(j => j.status !== "approved").length, icon: Shield, color: "amber" },
                ].map((stat) => (
                    <div key={stat.label} className={`p-6 rounded-3xl border-2 bg-white space-y-3`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                        <div className="text-3xl font-black font-outfit">{stat.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Judges Grid */}
            {judges.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-3xl">
                    <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No Judges Inducted</p>
                    <p className="text-slate-400 text-sm mt-1">Click "Induct Judge" to add an evaluator to the panel.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {judges.map((judge) => (
                        <div key={judge.id} className="group relative bg-white rounded-[2rem] border-2 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 p-6 space-y-4 overflow-hidden">
                            {/* Background Accent */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />

                            {/* Header */}
                            <div className="flex items-start justify-between relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200">
                                    {judge.full_name?.charAt(0) || "J"}
                                </div>
                                <div className="flex gap-1">
                                    <EditJudgeDialog judge={judge} onSuccess={refresh} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 hover:text-red-600">
                                                {deleting === judge.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="font-black font-outfit">Remove Judge?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <strong>{judge.full_name}</strong> will be permanently removed from the panel and all event assignments.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(judge.id)} className="rounded-xl bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="relative z-10 space-y-1">
                                <h3 className="font-black text-slate-900 text-lg leading-tight">{judge.full_name}</h3>
                                <p className="text-slate-400 text-xs font-medium">{judge.email}</p>
                            </div>

                            {/* Expertise */}
                            {judge.expertise && (
                                <div className="relative z-10">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                                        <Briefcase className="w-3 h-3" /> {judge.expertise}
                                    </span>
                                </div>
                            )}

                            {/* Bio */}
                            {judge.bio && (
                                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 relative z-10">{judge.bio}</p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative z-10">
                                <Badge variant={judge.status === "approved" ? "default" : "secondary"} className={`text-[9px] font-black uppercase tracking-widest rounded-full px-3 ${judge.status === "approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700"}`}>
                                    {judge.status === "approved" ? "● Active" : "○ Suspended"}
                                </Badge>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                    Since {new Date(judge.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
