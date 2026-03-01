import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { getSiteSettings } from "@/lib/cms";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Star, ExternalLink, Shield } from "lucide-react";
import { WinnersFilterClient } from "@/components/public/WinnersFilterClient";

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    const title = settings?.site_title || "CompeteEdu";
    return {
        title: `Winners Gallery — ${title}`,
        description: `Celebrating the extraordinary achievements of our national student community. View rankings, badges, and verified credentials.`,
        openGraph: { type: "website" },
    };
}

export default async function WinnersPage() {
    const supabase = await createClient();
    const settings = await getSiteSettings();
    const siteTitle = settings?.site_title || "CompeteEdu";

    // Fetch all public badges (non-participant tiers from published events)
    const { data: badges } = await supabase
        .from("badges")
        .select("*")
        .eq("is_public", true)
        .in("tier", ["gold", "silver", "bronze"])
        .order("tier", { ascending: true })
        .order("issued_at", { ascending: false });

    // Stats
    const { count: totalParticipants } = await supabase.from("badges").select("id", { count: "exact", head: true });
    const { count: totalEvents } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("results_status", "published");
    const { count: goldCount } = await supabase.from("badges").select("id", { count: "exact", head: true }).eq("tier", "gold");

    // Get unique event names for filter
    const eventNames = [...new Set(badges?.map(b => b.event_name) || [])];

    return (
        <div className="bg-[#080B1A] min-h-screen pb-32 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] -left-[15%] w-[50%] aspect-square bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] right-[-10%] w-[40%] aspect-square bg-indigo-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[20%] w-[35%] aspect-square bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <section className="container mx-auto px-6 pt-24 mb-20 text-center space-y-8 relative z-10">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-amber-400 mb-8">
                    <Trophy className="w-3.5 h-3.5" /> Wall of Excellence · {siteTitle}
                </div>

                <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white leading-[0.85] drop-shadow-sm">
                    Winners <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 italic">Gallery</span>
                </h1>

                <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                    Celebrating extraordinary achievement. Every badge is cryptographically verified and permanently recorded.
                </p>

                {/* Live Stats */}
                <div className="flex flex-wrap justify-center gap-12 pt-10 border-t border-white/5 mt-12">
                    {[
                        { label: "Total Laureates", value: totalParticipants || 0 },
                        { label: "Gold Awardees", value: goldCount || 0 },
                        { label: "Events Complete", value: totalEvents || 0 },
                    ].map(stat => (
                        <div key={stat.label} className="text-center">
                            <div className="text-4xl font-black font-outfit text-white">{stat.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Filter + Grid (Client Component) */}
            <div className="container mx-auto px-6 relative z-10">
                {badges && badges.length > 0 ? (
                    <WinnersFilterClient badges={badges as any[]} eventNames={eventNames} />
                ) : (
                    <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-md rounded-[3rem] p-20 border border-white/10 text-center space-y-8">
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                            <Star className="w-10 h-10 text-slate-600" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black font-outfit uppercase tracking-tight text-white">The Gallery is Preparing</h2>
                            <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                                Results for the current season are being finalised by our board of adjudicators. New laureates will be announced shortly.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/competitions">
                                <Button className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90">
                                    View Competitions
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-[10px]">
                                    Student Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
