import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveRight, Calendar, Trophy, ArrowUpRight, ScrollText, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { getCurrentUserAction } from "@/app/actions/session";
import { getSiteSettings } from "@/lib/cms";
import EventCarousel from "@/components/public/EventCarousel";

export default async function HomePage() {
    const supabase = await createClient();
    const settings = await getSiteSettings();

    const user = await getCurrentUserAction();
    const userSchoolId = user?.school_id;

    // Fetch events
    const { data: allUpcoming } = await supabase
        .from('events')
        .select('*, schools(name)')
        .order('end_date', { ascending: true });

    const filteredEvents = allUpcoming?.filter(event => {
        if (!event.is_private || user?.role === 'super_admin') return true;
        return event.school_id === userSchoolId;
    }) ?? [];

    // 5 most recent events for carousel
    const carouselEvents = filteredEvents.slice(0, 5);

    // 3 upcoming for deadlines sidebar
    const upcomingEvents = filteredEvents.slice(0, 3);

    const heroImage = settings?.home_hero_image || "/national_talent_search_poster_1771809515695.png";

    return (
        <div className="flex flex-col gap-24 pb-32 bg-background">
            {/* --- TOP BANNER / HERO SPLIT --- */}
            <section className="container mx-auto px-6 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* LEFT: Event Carousel (8 cols) */}
                    <div className="lg:col-span-8">
                        <EventCarousel events={carouselEvents} fallbackImage={heroImage} />
                    </div>

                    {/* RIGHT: Institutional Activity Sidebar (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Upcoming Deadlines */}
                        <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 flex-1 shadow-lg shadow-slate-200/50 flex flex-col relative overflow-hidden">
                            {/* Subtle background decoration */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-50"></div>

                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6 relative z-10">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Institutional</h3>
                                    <p className="text-xl font-black font-outfit uppercase tracking-tight text-slate-800">Deadlines</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="space-y-4 flex-1 relative z-10">
                                {upcomingEvents?.map((event: any) => (
                                    <Link key={event.id} href={`/competitions/${event.id}`} className="group block">
                                        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                            <div className="w-12 h-12 rounded-full border-2 border-slate-100 bg-white flex flex-col items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-primary/5 transition-colors shadow-sm">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none">{format(new Date(event.end_date), "MMM")}</span>
                                                <span className="text-xl font-black text-slate-800 leading-none mt-0.5">{format(new Date(event.end_date), "dd")}</span>
                                            </div>
                                            <div className="space-y-1 overflow-hidden mt-1">
                                                <h4 className="text-sm font-bold text-slate-800 truncate uppercase tracking-tight group-hover:text-primary transition-colors">{event.title}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                                                    <span>{event.media_type} submission</span>
                                                    {event.is_private && (
                                                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest text-[7px] flex items-center gap-1 font-black border border-red-100 shadow-sm">
                                                            <XCircle className="w-2.5 h-2.5" /> Private • {event.schools?.name}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <Link href="/competitions" className="mt-8 relative z-10">
                                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300">
                                    All Competitions <MoveRight className="ml-2 w-3 h-3" />
                                </Button>
                            </Link>
                        </div>

                    </div>
                </div>
            </section >

            {/* --- STATS SECTION (Premium Row) --- */}
            < section className="container mx-auto px-6" >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border border-slate-100 items-center bg-white rounded-[2rem] shadow-sm">
                    {[
                        { label: "Registered Schools", value: "250+", prefix: "A" },
                        { label: "Active Competitions", value: "12", prefix: "B" },
                        { label: "Ranked Students", value: "1.2k", prefix: "C" },
                        { label: "Academic Experts", value: "45", prefix: "D" },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-3 relative group">
                            {i !== 0 && <div className="absolute left-[-10%] top-1/2 -translate-y-1/2 w-[1px] h-12 bg-slate-100 hidden md:block"></div>}
                            <div className="flex items-center gap-2 mb-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">


                            </div>
                            <div className="text-5xl font-black font-outfit text-slate-800 tracking-tighter drop-shadow-sm">{stat.value}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section >

            {/* --- CORE PILLARS / FEATURES (Minimalist Tiles) --- */}
            < section className="container mx-auto px-6 space-y-20" >
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
                    <div className="w-16 h-1.5 rounded-full bg-primary mb-6" />
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-outfit text-slate-900 uppercase leading-[0.9] tracking-tighter drop-shadow-sm">
                        Institutional <br /> Excellence Pillar
                    </h2>
                    <p className="text-slate-600 font-medium text-lg leading-relaxed">
                        Our framework provides the most transparent and inclusive platform to empower students globally through curated academic competitions.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    {[
                        {
                            title: "Curated Competitions",
                            desc: "High-standard selection of categories ranging from fine arts to advanced robotics, monitored by national directors.",
                            icon: Trophy,
                            color: "bg-amber-50 text-amber-500 border-amber-100 group-hover:bg-amber-100"
                        },
                        {
                            title: "Electronic Certification",
                            desc: "Winners receive stunning blockchain-verified electronic badges and inclusion in the Global Winners Gallery.",
                            icon: ScrollText,
                            color: "bg-indigo-50 text-indigo-500 border-indigo-100 group-hover:bg-indigo-100"
                        },
                        {
                            title: "Transparent Assessment",
                            desc: "Standardized scoring rubrics and detailed feedback from certified national adjudicators for every submission.",
                            icon: MoveRight,
                            color: "bg-emerald-50 text-emerald-500 border-emerald-100 group-hover:bg-emerald-100"
                        }
                    ].map((feature, i) => (
                        <div key={i} className="group flex flex-col items-center text-center space-y-8 p-12 rounded-[2.5rem] bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
                            {/* Decorative background circle */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-50 rounded-full blur-3xl opacity-50 transition-transform group-hover:scale-150 group-hover:bg-primary/5"></div>

                            <div className={`relative z-10 w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 border ${feature.color}`}>
                                <feature.icon className="w-8 h-8" />
                            </div>
                            <div className="space-y-4 flex-1 relative z-10">
                                <h3 className="text-2xl font-black font-outfit uppercase tracking-tight text-slate-800 group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </div>
                            <Link href="/about" className="relative z-10 inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-b-2 border-transparent pb-1 hover:border-primary hover:text-primary transition-all mt-4">
                                Explore Methodology
                            </Link>
                        </div>
                    ))}
                </div>
            </section >

            {/* --- CTA: FINAL CALL (Centered Editorial) --- */}
            < section className="container mx-auto px-6" >
                <div className="bg-slate-50 rounded-[3rem] p-16 md:p-24 text-center relative overflow-hidden border-2 border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="absolute top-0 left-0 w-full h-full opacity-60 pointer-events-none mix-blend-multiply">
                        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10 space-y-12 max-w-4xl mx-auto">
                        <div className="space-y-6">
                            <div className="flex justify-center mb-10">
                                <div className="w-16 h-16 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                                    <MoveRight className="w-8 h-8 text-primary rotate-90" />
                                </div>
                            </div>
                            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black font-outfit text-slate-900 uppercase leading-[0.9] tracking-tighter drop-shadow-sm">
                                Start Your <br />
                                <span className="inline-block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 font-black">Legacy</span>
                            </h2>
                            <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed pt-2">
                                Join our global network of institutions and give your students the international platform they deserve.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <Link href="/login?view=signup">
                                <Button className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 transition-all active:scale-95 group/btn border-2 border-transparent">
                                    Register School <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-slate-300 font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95">
                                    Support Desk
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section >
        </div >
    );
}
