import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveRight, Calendar, Trophy, ArrowUpRight, ScrollText, XCircle } from "lucide-react";
import { format } from "date-fns";
import { getCurrentUserAction } from "@/app/actions/session";
import { getSiteSettings } from "@/lib/cms";
import EventCarousel from "@/components/public/EventCarousel";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const settings = JSON.parse(JSON.stringify(await getSiteSettings()));

    const user = JSON.parse(JSON.stringify(await getCurrentUserAction()));
    const userSchoolId = user?.school_id;

    const adminAppwrite = getAppwriteAdmin();

    // Fetch events
    let allUpcoming: any[] = [];
    try {
        const res = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "events", [
            Query.orderAsc("end_date")
        ]);

        allUpcoming = JSON.parse(JSON.stringify(await Promise.all(
            res.documents.map(async (ev) => {
                let schoolData = null;
                if (ev.school_id) {
                    try {
                        schoolData = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "schools", ev.school_id);
                    } catch (e) { }
                }
                return {
                    ...ev,
                    id: ev.$id,
                    schools: schoolData
                };
            })
        )));
    } catch (e) { }

    const filteredEvents = allUpcoming ?? [];

    // 5 most recent events for carousel
    const carouselEvents = filteredEvents.slice(0, 5);

    // 3 upcoming for deadlines sidebar
    const upcomingEvents = filteredEvents.slice(0, 3);

    // Fetch winners
    let recentWinners: any[] = [];
    try {
        const winRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "badges", [
            Query.equal("is_public", true),
            Query.orderDesc("issued_at"),
            Query.limit(6)
        ]);
        recentWinners = JSON.parse(JSON.stringify(winRes.documents));
    } catch (e) { }

    // Fetch News with views (or latest)
    let featuredNews: any[] = [];
    try {
        const newsRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "news", [
            Query.orderDesc("published_at"),
            Query.limit(3)
        ]);
        featuredNews = JSON.parse(JSON.stringify(newsRes.documents));
    } catch (e) { }

    const heroImage = settings?.home_hero_image || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop";

    const TIER_CONFIG: Record<string, any> = {
        gold: { label: "Gold", emoji: "🥇", color: "text-amber-400", bg: "bg-amber-400/10" },
        silver: { label: "Silver", emoji: "🥈", color: "text-slate-300", bg: "bg-slate-300/10" },
        bronze: { label: "Bronze", emoji: "🥉", color: "text-orange-400", bg: "bg-orange-400/10" },
    };

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

            {/* --- RECENT WINNERS SECTION --- */}
            {recentWinners.length > 0 && (
                <section className="container mx-auto px-6 space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="w-12 h-1 rounded-full bg-amber-500" />
                            <h2 className="text-4xl md:text-5xl font-black font-outfit text-slate-900 uppercase tracking-tighter leading-none">
                                Wall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-400 italic">Excellence</span>
                            </h2>
                            <p className="text-slate-500 font-medium max-w-xl">Celebrating the latest achievers who have showcased exceptional talent across our national framework.</p>
                        </div>
                        <Link href="/winners">
                            <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px] gap-2 group">
                                View Full Gallery <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentWinners.map((winner: any) => {
                            const cfg = TIER_CONFIG[winner.tier] || TIER_CONFIG.gold;
                            return (
                                <div key={winner.$id} className="p-6 rounded-[2rem] bg-white border-2 border-slate-100 hover:border-amber-200 hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                        <Trophy className="w-16 h-16 text-slate-900" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center font-black text-lg`}>
                                            {cfg.emoji}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 line-clamp-1">{winner.student_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{winner.school_name}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 line-clamp-1 max-w-[70%]">{winner.event_name}</p>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* --- FEATURED NEWS SECTION --- */}
            {featuredNews.length > 0 && (
                <section className="bg-slate-950 py-24 text-white">
                    <div className="container mx-auto px-6 space-y-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-12">
                            <div className="space-y-4">
                                <div className="w-12 h-1 rounded-full bg-primary" />
                                <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter leading-none">
                                    Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">Insights</span>
                                </h2>
                                <p className="text-slate-400 font-medium max-w-xl">Deep dives into the latest events, innovations, and community stories.</p>
                            </div>
                            <Link href="/news">
                                <Button variant="outline" className="border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] gap-2 rounded-xl">
                                    Explore All News <ArrowUpRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {featuredNews.map((news: any) => (
                                <Link key={news.$id} href={`/news/${news.$id}`} className="group space-y-6">
                                    <div className="aspect-[16/10] rounded-[2.5rem] bg-slate-900 border border-white/5 overflow-hidden relative">
                                        {news.image_url ? (
                                            <img src={news.image_url} alt={news.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ScrollText className="w-12 h-12 text-slate-800" />
                                            </div>
                                        )}
                                        <div className="absolute top-6 left-6">
                                            <span className="bg-primary/20 backdrop-blur-md text-primary border border-primary/30 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Featured</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 px-2">
                                        <h3 className="text-2xl font-black font-outfit uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">{news.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{news.content}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

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
                            <Link href="/register-school">
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
