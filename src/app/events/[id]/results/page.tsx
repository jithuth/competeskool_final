import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/cms";
import { Shield, Trophy, Calendar, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TIER_CONFIG = {
    gold: { label: "Gold", emoji: "🥇", bg: "from-amber-950/60 to-yellow-950/40", border: "border-amber-500/20", accent: "text-amber-400", pill: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
    silver: { label: "Silver", emoji: "🥈", bg: "from-slate-900/80 to-slate-800/50", border: "border-slate-500/20", accent: "text-slate-300", pill: "bg-slate-500/15 text-slate-300 border-slate-500/25" },
    bronze: { label: "Bronze", emoji: "🥉", bg: "from-orange-950/60 to-amber-950/40", border: "border-orange-500/20", accent: "text-orange-400", pill: "bg-orange-500/15 text-orange-300 border-orange-500/25" },
    participant: { label: "Participant", emoji: "🏅", bg: "from-indigo-950/40 to-slate-900/60", border: "border-indigo-500/20", accent: "text-indigo-400", pill: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25" },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: event } = await supabase.from("events").select("title").eq("id", id).single();
    const settings = await getSiteSettings();
    return {
        title: `${event?.title || "Event"} — Results | ${settings?.site_title || "CompeteEdu"}`,
        description: `Official results and rankings for ${event?.title}.`,
    };
}

export default async function EventResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params;
    const supabase = await createClient();

    const { data: event } = await supabase
        .from("events")
        .select("id, title, description, results_status, results_published_at, banner_url")
        .eq("id", eventId)
        .single();

    if (!event) notFound();

    if (event.results_status !== "published") {
        return (
            <div className="bg-[#080B1A] min-h-screen flex items-center justify-center p-6">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-slate-600" />
                    </div>
                    <h1 className="text-3xl font-black font-outfit text-white uppercase tracking-tight">{event.title}</h1>
                    <p className="text-slate-400 font-medium">
                        Results for this event have not been published yet. Check back after the evaluation concludes.
                    </p>
                    <Link href="/competitions">
                        <Button className="h-12 px-6 rounded-xl font-black uppercase text-xs tracking-widest">
                            View All Events
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch results
    const { data: results } = await supabase
        .from("submission_results")
        .select(`
            id, weighted_score, rank, tier, judge_count,
            student_id,
            profiles!inner(full_name, schools(name)),
            submissions!inner(title)
        `)
        .eq("event_id", eventId)
        .order("rank", { ascending: true });

    // Fetch badges for verify links
    const { data: badges } = await supabase
        .from("badges")
        .select("student_id, credential_id, tier")
        .eq("event_id", eventId);

    const badgeMap = new Map(badges?.map(b => [b.student_id, b]) || []);

    const goldResults = results?.filter(r => r.tier === "gold") || [];
    const silverResults = results?.filter(r => r.tier === "silver") || [];
    const bronzeResults = results?.filter(r => r.tier === "bronze") || [];
    const others = results?.filter(r => r.tier === "participant") || [];

    const publishDate = event.results_published_at
        ? new Date(event.results_published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : "";

    return (
        <div className="bg-[#080B1A] min-h-screen pb-32 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-amber-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Event Banner */}
            {event.banner_url && (
                <div className="w-full h-52 md:h-72 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080B1A]/60 to-[#080B1A]" />
                </div>
            )}

            <div className="container mx-auto px-6 relative z-10 pt-16 space-y-16">
                {/* Header */}
                <div className="space-y-6">
                    <Link href="/competitions" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> All Competitions
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                <Trophy className="w-3 h-3" /> Official Results
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black font-outfit text-white uppercase tracking-tighter leading-tight">{event.title}</h1>
                            {publishDate && (
                                <p className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    <Calendar className="w-3.5 h-3.5" /> Published {publishDate}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-4 text-center">
                            {[
                                { label: "Total Ranked", value: results?.length || 0 },
                                { label: "Gold", value: goldResults.length },
                                { label: "Judges", value: results?.[0]?.judge_count || "—" },
                            ].map(s => (
                                <div key={s.label} className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-2xl font-black font-outfit text-white">{s.value}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Podium — Top 3 */}
                {goldResults.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">🏆 Top Achievers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...goldResults.slice(0, 3), ...silverResults.slice(0, Math.max(0, 3 - goldResults.length))].slice(0, 3).map((result: any) => {
                                const tier = result.tier as keyof typeof TIER_CONFIG;
                                const cfg = TIER_CONFIG[tier] || TIER_CONFIG.participant;
                                const badge = badgeMap.get(result.student_id);
                                const isTop = result.rank === 1;

                                return (
                                    <div key={result.id} className={`relative bg-gradient-to-br ${cfg.bg} rounded-[2rem] p-8 border ${cfg.border} ${isTop ? "md:scale-105 shadow-2xl shadow-amber-500/10" : ""} transition-all space-y-5 text-center`}>
                                        <div className="text-5xl">{cfg.emoji}</div>
                                        <div>
                                            <h3 className="text-xl font-black text-white font-outfit">{result.profiles?.full_name}</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{result.profiles?.schools?.name}</p>
                                        </div>
                                        <div className={`text-4xl font-black font-outfit ${cfg.accent}`}>
                                            {parseFloat(result.weighted_score).toFixed(1)}
                                            <span className="text-sm text-slate-600">/100</span>
                                        </div>
                                        <Badge className={`text-[9px] font-black uppercase rounded-full px-3 border ${cfg.pill}`}>
                                            Rank #{result.rank} · {cfg.label}
                                        </Badge>
                                        {badge && (
                                            <Link href={`/verify/${badge.credential_id}`}>
                                                <Button size="sm" className="w-full h-9 rounded-xl text-[9px] font-black uppercase tracking-widest gap-1.5 bg-white/10 hover:bg-white/20 text-white mt-2">
                                                    <Shield className="w-3 h-3" /> Verify Badge
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Full Leaderboard */}
                <div className="space-y-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Complete Rankings</h2>
                    <div className="rounded-3xl border border-white/5 bg-white/3 backdrop-blur-sm overflow-hidden">
                        <div className="divide-y divide-white/5">
                            {results?.map((result: any, index) => {
                                const tier = result.tier as keyof typeof TIER_CONFIG;
                                const cfg = TIER_CONFIG[tier] || TIER_CONFIG.participant;
                                const badge = badgeMap.get(result.student_id);
                                return (
                                    <div key={result.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors ${index < 3 ? "bg-amber-500/3" : ""}`}>
                                        <div className="w-10 text-center text-sm font-black">
                                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : (
                                                <span className="text-slate-600">{result.rank}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-white text-sm">{result.profiles?.full_name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium truncate">{result.profiles?.schools?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`text-lg font-black font-outfit ${cfg.accent}`}>
                                                {parseFloat(result.weighted_score).toFixed(1)}
                                                <span className="text-xs text-slate-700 font-normal">/100</span>
                                            </span>
                                            <Badge className={`hidden md:inline-flex text-[9px] font-black uppercase rounded-full px-3 border ${cfg.pill}`}>
                                                {cfg.emoji} {cfg.label}
                                            </Badge>
                                            {badge && (
                                                <Link href={`/verify/${badge.credential_id}`}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-slate-600 hover:text-amber-400 hover:bg-amber-500/10">
                                                        <Shield className="w-3.5 h-3.5" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
