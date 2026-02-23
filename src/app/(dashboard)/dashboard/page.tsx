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
    } else {
        const { count } = await supabase.from('submissions').select('id', { count: 'exact', head: true });
        submissionsCount = count || 0;
    }

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
            trend: isSchoolAdmin ? "From School" : "+24 today",
            desc: "Student Projects",
            link: isSchoolAdmin ? "/dashboard/submissions" : "/dashboard/my-submissions"
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


        </div>
    );
}
