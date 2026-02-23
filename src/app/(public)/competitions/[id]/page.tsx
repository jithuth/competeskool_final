import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, ScrollText, Share2, Award, Info, ArrowLeft, Trophy, Clock, Video, Image as ImageIcon, Music, XCircle, Lock } from "lucide-react";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = (await params).id;
    const supabase = await createClient();

    const { data: event } = await supabase
        .from("events")
        .select("*, schools(name)")
        .eq("id", id)
        .single();

    if (!event) return { title: "Event Not Found" };

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${event.title} | Student Awards Management`,
        description: event.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || "Join the competition and showcase your talent.",
        openGraph: {
            images: [event.banner_url || "", ...previousImages],
        },
    };
}

export default async function EventDetailPage({ params }: Props) {
    const id = (await params).id;
    const supabase = await createClient();

    const { data: event } = await supabase
        .from("events")
        .select("*, schools(name)")
        .eq("id", id)
        .single();

    if (!event) notFound();

    const { getCurrentUserAction } = await import("@/app/actions/session");
    const user = await getCurrentUserAction();
    const userSchoolId = user?.school_id;

    // Access control for private events
    if (event.is_private && event.school_id !== userSchoolId && user?.role !== 'super_admin') {
        // Technically this should be 403, but notFound or redirect is fine
        notFound();
    }

    const isExpired = new Date(event.end_date) < new Date();

    return (
        <div className="min-h-screen bg-[#080B1A]">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                {event.banner_url ? (
                    <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <ScrollText className="w-20 h-20 text-slate-800" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080B1A] via-slate-900/40 to-transparent" />

                <div className="absolute inset-0 flex items-end">
                    <div className="container mx-auto px-6 pb-16">
                        <Link
                            href="/competitions"
                            className="inline-flex items-center text-white/70 hover:text-white mb-8 text-sm font-bold uppercase tracking-widest transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Competitions
                        </Link>

                        <div className="max-w-4xl space-y-6">
                            <div className="flex flex-wrap gap-3">
                                <Badge className="bg-primary/20 text-primary-foreground border-primary/20 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                    {event.status}
                                </Badge>
                                <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    {event.media_type === 'video' && <Video className="w-3.5 h-3.5" />}
                                    {event.media_type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                                    {event.media_type === 'audio' && <Music className="w-3.5 h-3.5" />}
                                    {event.media_type} submission
                                </Badge>
                                {event.is_private && (
                                    <Badge className="bg-red-500/20 text-red-100 border-red-500/30 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                        <XCircle className="w-3.5 h-3.5" /> Private Event • {event.schools?.name || "Targeted School"}
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black font-outfit text-white uppercase tracking-tight leading-[0.9] drop-shadow-lg">
                                {event.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 -mt-10 relative z-10 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-xl shadow-primary/5 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timeline</p>
                                    <p className="text-xs font-bold text-white mt-1">
                                        {format(new Date(event.start_date), "dd MMM")} - {format(new Date(event.end_date), "dd MMM yyyy")}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-xl shadow-primary/5 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Winners Release</p>
                                    <p className="text-xs font-bold text-white mt-1">TBA</p>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-xl shadow-primary/5 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline</p>
                                    <p className="text-xs font-bold text-white mt-1">
                                        {isExpired ? "Closed" : format(new Date(event.end_date), "PPP")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-xl shadow-primary/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-white">Brief Overview</h2>
                            </div>
                            <div
                                className="html-output prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: event.description || "" }}
                            />
                        </div>

                        {/* Rules */}
                        <div className="bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-10 shadow-2xl space-y-6 relative overflow-hidden border border-slate-800">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <Award className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-white">Competition Guidelines</h2>
                            </div>
                            <div
                                className="html-output prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium relative z-10"
                                dangerouslySetInnerHTML={{ __html: event.full_rules || "" }}
                            />
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-xl shadow-primary/5 sticky top-28">
                            <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-white mb-6 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-indigo-400" /> Participate
                            </h3>

                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 font-medium">
                                    To participate in this competition, please log in through your institutional portal.
                                </p>

                                <Link href="/login" className="block">
                                    <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                                        Login to Apply
                                    </Button>
                                </Link>

                                <div className="pt-6 border-t border-slate-800">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Institutional Requirements</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-2 text-xs font-bold text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Open to all registered schools
                                        </li>
                                        <li className="flex items-start gap-2 text-xs font-bold text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> One entry per category
                                        </li>
                                        <li className="flex items-start gap-2 text-xs font-bold text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Media must be {event.media_type} format
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
