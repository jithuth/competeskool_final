import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, ArrowRight, Award, XCircle, Lock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getCurrentUserAction } from "@/app/actions/session";

export default async function CompetitionsPage() {
    const supabase = await createClient();
    const user = await getCurrentUserAction();
    const userSchoolId = user?.school_id;

    let query = supabase
        .from("events")
        .select("*, schools(name)")
        .order("end_date", { ascending: true });

    const { data: allEvents } = await query;

    // Bypass filtration so all events are visible to everyone
    const events = allEvents;

    return (
        <div className="bg-[#080B1A] min-h-screen pb-32">
            {/* Editorial Header */}
            <div className="container mx-auto px-6 pt-24 mb-20 text-center space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-1 bg-primary" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white leading-[0.85] drop-shadow-sm">
                        All-India <br />
                        Competitions <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">2026</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed mt-8">
                        A curated selection of India&apos;s most prestigious school awards and creative challenges. Empowering students through national recognition.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {events && events.length > 0 ? (
                        events.map((event) => (
                            <Link key={event.id} href={`/competitions/${event.id}`} className="group block">
                                <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-10 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col md:flex-row items-center gap-10 h-full relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Left: Metadata */}
                                    <div className="flex-1 space-y-6 text-center md:text-left">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] font-outfit drop-shadow-sm">
                                                Deadline: {format(new Date(event.end_date), "dd MMMM yyyy")}
                                            </p>
                                            <h2 className="text-3xl font-black font-outfit uppercase tracking-tight text-white group-hover:text-primary transition-colors leading-tight drop-shadow-sm">
                                                {event.title}
                                            </h2>
                                        </div>

                                        <div
                                            className="text-sm text-slate-300 line-clamp-2 font-medium leading-relaxed [&_p]:m-0"
                                            dangerouslySetInnerHTML={{ __html: event.description || "" }}
                                        />

                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                            <Badge variant="outline" className="rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-slate-700 text-slate-300 bg-slate-800/50">
                                                {event.media_type}
                                            </Badge>
                                            {event.is_private && (
                                                <Badge variant="outline" className="rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-red-500/50 text-red-400 bg-red-950/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                                    <XCircle className="w-3 h-3" /> Private Event • {event.schools?.name || "Targeted School"}
                                                </Badge>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {format(new Date(event.start_date), "MMM yyyy")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Circular Badge */}
                                    <div className="shrink-0 relative">
                                        <div className="w-40 h-40 rounded-full border border-slate-700 p-2 group-hover:rotate-[15deg] transition-transform duration-700 bg-slate-800/50">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 shadow-inner group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all border border-slate-800">
                                                {event.banner_url ? (
                                                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                        <Trophy className="w-12 h-12 text-slate-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)] group-hover:scale-110 transition-transform">
                                            <ArrowRight className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-slate-900/30 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-800 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50 pointer-events-none" />
                            <div className="relative z-10">
                                <Award className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                                <h3 className="text-2xl font-black font-outfit uppercase tracking-tight text-slate-300">No Institutional Awards Open</h3>
                                <p className="text-slate-500 font-medium mt-2">Please verify back shortly for the 2026 academic calendar.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
