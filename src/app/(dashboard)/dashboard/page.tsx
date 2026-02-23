import { createClient } from "@/lib/supabase/server";
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Trophy,
    Users,
    Calendar,
    Video,
    ArrowUpRight,
    School,
    ShieldCheck,
    PlusCircle,
    Bell,
    TrendingUp,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SubmissionsTable } from "@/components/dashboard/submissions/SubmissionsTable";
import { SubmissionWizard } from "@/components/dashboard/submissions/SubmissionWizard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Rocket, Target, Sparkles, ExternalLink } from "lucide-react";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user profile for role and name
    const { data: profile } = await supabase
        .from("profiles")
        .select("*, schools(name)")
        .eq("id", user?.id)
        .single();

    // Fetch stats based on role
    const isSuperAdmin = profile?.role === 'super_admin';
    const isSchoolAdmin = profile?.role === 'school_admin';
    const schoolId = profile?.school_id;

    // Aggregates for stats with role-based filtering
    let studentsQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    if (isSchoolAdmin) studentsQuery = studentsQuery.eq('school_id', schoolId);
    const { count: studentsCount } = await studentsQuery;

    let schoolsQuery = supabase.from('schools').select('*', { count: 'exact', head: true });
    // If school admin, we might want to show teachers instead of schools
    const { count: schoolsCount } = await schoolsQuery;

    let teachersCount = 0;
    if (isSchoolAdmin) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('school_id', schoolId);
        teachersCount = count || 0;
    }

    let eventsCount = 0;
    const { count: eCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active');
    eventsCount = eCount || 0;

    let submissionsCount = 0;
    if (isSchoolAdmin) {
        const { count } = await supabase
            .from('submissions')
            .select('id, profiles!student_id(school_id)', { count: 'exact', head: true })
            .eq('profiles.school_id', schoolId);
        submissionsCount = count || 0;
    } else if (profile?.role === 'student') {
        const { count } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('student_id', user?.id);
        submissionsCount = count || 0;
    } else {
        const { count } = await supabase.from('submissions').select('id', { count: 'exact', head: true });
        submissionsCount = count || 0;
    }

    // Fetch Active Events & Submissions for the Table
    const { data: activeEvents } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    let submissionsQuery = supabase
        .from('submissions')
        .select('*, events(title), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(10);

    if (profile?.role === 'student') {
        submissionsQuery = submissionsQuery.eq('student_id', user?.id);
    } else if (isSchoolAdmin) {
        submissionsQuery = submissionsQuery.eq('profiles.school_id', schoolId);
    } else if (profile?.role === 'teacher') {
        // Find students assigned to this teacher
        const { data: studentIds } = await supabase.from('students').select('id').eq('teacher_id', user?.id);
        const ids = studentIds?.map(s => s.id) || [];
        submissionsQuery = submissionsQuery.in('student_id', ids);
    }

    const { data: recentSubmissions } = await submissionsQuery;

    const stats = [
        {
            title: "Students",
            value: studentsCount?.toLocaleString() || "0",
            icon: Users,
            bg: "bg-blue-600",
            lightBg: "bg-blue-500/10",
            gradient: "from-blue-600 to-blue-400",
            trend: isSchoolAdmin ? "Institutional" : "+12.5%",
            desc: isSchoolAdmin ? "Registered Students" : "Active Learners",
            link: "/dashboard/students"
        },
        isSchoolAdmin ? {
            title: "Teachers",
            value: teachersCount?.toLocaleString() || "0",
            icon: ShieldCheck,
            bg: "bg-purple-600",
            lightBg: "bg-purple-500/10",
            gradient: "from-purple-600 to-purple-400",
            trend: "Active",
            desc: "Faculty Members",
            link: "/dashboard/teachers"
        } : {
            title: "Schools",
            value: schoolsCount?.toLocaleString() || "0",
            icon: School,
            bg: "bg-emerald-600",
            lightBg: "bg-emerald-500/10",
            gradient: "from-emerald-600 to-emerald-400",
            trend: "+3 New",
            desc: "Institutional Partners",
            link: "/dashboard/schools"
        },
        {
            title: "Live Events",
            value: eventsCount?.toLocaleString() || "0",
            icon: Calendar,
            bg: "bg-amber-500",
            lightBg: "bg-amber-500/10",
            gradient: "from-amber-600 to-amber-400",
            trend: "Active",
            desc: "Competitions",
            link: "/dashboard/events"
        },
        {
            title: "Submissions",
            value: submissionsCount?.toLocaleString() || "0",
            icon: Video,
            bg: "bg-rose-600",
            lightBg: "bg-rose-500/10",
            gradient: "from-rose-600 to-rose-400",
            trend: isSchoolAdmin || profile?.role === 'teacher' ? "Institutional" : "+24 today",
            desc: profile?.role === 'student' ? "Your Entries" : "Student Projects",
            link: profile?.role === 'student' ? "/dashboard/my-submissions" : "/dashboard/evaluate"
        },
    ];


    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent blur-3xl -z-0" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                            {profile?.role?.replace('_', ' ')} Dashboard
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-black font-outfit leading-tight">
                            Welcome back, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                {(() => {
                                    const parts = profile?.full_name?.split(' ') || [];
                                    if (parts.length > 1 && /^(Dr|Mr|Mrs|Ms|Prof)\.?/i.test(parts[0] || '')) {
                                        return `${parts[0]} ${parts[1]}`;
                                    }
                                    return parts[0] || "Administrator";
                                })()}!
                            </span>
                        </h1>
                        <p className="text-slate-400 max-w-md text-lg font-light leading-relaxed">
                            {isSuperAdmin
                                ? "Your global educational ecosystem is thriving. Monitor performance and manage institutional growth here."
                                : profile?.role === 'student'
                                    ? "Your journey to excellence continues. Ready to tackle a new challenge today?"
                                    : `Managing excellence at ${profile?.schools?.name || "your institution"}.`}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {isSuperAdmin && (
                            <>
                                <Button asChild className="bg-white text-slate-950 hover:bg-slate-200 rounded-2xl h-14 px-8 font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95">
                                    <Link href="/dashboard/events">
                                        <PlusCircle className="mr-2 w-5 h-5" /> Create Event
                                    </Link>
                                </Button>
                                <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-14 px-8 font-bold text-base backdrop-blur-md transition-all">
                                    <Link href="/dashboard/schools">
                                        <ShieldCheck className="mr-2 w-5 h-5" /> Review Schools
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* AdminLTE Inspired Small Boxes */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-2xl shadow-lg border-2 border-transparent transition-all hover:scale-[1.02] hover:-translate-y-1 group ${stat.bg} text-white`}>
                        <div className="p-6 relative z-10">
                            <h3 className="text-4xl font-black font-outfit mb-1">{stat.value}</h3>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-wider">{stat.title}</p>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full uppercase tracking-tighter">
                                    {stat.trend}
                                </span>
                            </div>
                        </div>

                        {/* The classic AdminLTE large background icon */}
                        <stat.icon className="absolute top-1/2 right-[-10px] w-32 h-32 opacity-15 -translate-y-1/2 rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

                        <Link href={stat.link} className="block w-full py-2 bg-black/10 hover:bg-black/20 text-center text-xs font-bold transition-colors group-hover:underline">
                            View Details <ArrowUpRight className="inline w-3 h-3 ml-1" />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Student Specific: Available Events Arena */}
            {profile?.role === 'student' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Target className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black font-outfit uppercase tracking-tight">Active Arenas</h2>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeEvents?.map((event) => (
                            <Card key={event.id} className="rounded-[2.5rem] overflow-hidden border-2 hover:border-primary/30 transition-all group">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge className="bg-slate-100 text-slate-800 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                                            {event.media_type} competition
                                        </Badge>
                                        <Sparkles className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <CardTitle className="text-2xl font-black font-outfit uppercase leading-tight mb-2 group-hover:text-primary transition-colors">
                                        {event.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 text-slate-500 font-medium leading-relaxed">
                                        {event.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 pt-4">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-primary transition-all font-black uppercase tracking-widest text-xs gap-3">
                                                Enter Arena <Rocket className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-6xl rounded-[3rem] overflow-hidden p-0 border-2 border-slate-50 shadow-2xl bg-white/95 backdrop-blur-xl">
                                            <DialogHeader className="p-8 pb-0">
                                                <DialogTitle className="text-3xl font-black font-outfit uppercase flex items-center gap-3">
                                                    <Target className="w-8 h-8 text-primary" /> {event.title}
                                                </DialogTitle>
                                                <DialogDescription className="text-slate-500 font-medium">
                                                    Complete the following steps to submit your project for evaluation.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="p-8">
                                                <SubmissionWizard events={activeEvents || []} initialEventId={event.id} />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Unified Submissions Table */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600/10 flex items-center justify-center text-rose-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black font-outfit uppercase tracking-tight">
                            {profile?.role === 'student' ? "Your Mission Logs" : "Global Transmission Feed"}
                        </h2>
                    </div>
                </div>

                <SubmissionsTable submissions={recentSubmissions || []} role={profile?.role || 'student'} />
            </div>


        </div>
    );
}
