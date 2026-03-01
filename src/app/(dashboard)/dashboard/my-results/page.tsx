import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Share2, Download, QrCode, ExternalLink, Star, Award } from "lucide-react";
import { BadgeShareButtons } from "@/components/dashboard/results/BadgeShareButtons";

const TIER_CONFIG = {
    gold: { label: "Gold", emoji: "🥇", bg: "from-amber-50 to-yellow-50", border: "border-amber-200", accent: "text-amber-600", pill: "bg-amber-100 text-amber-700 border-amber-200" },
    silver: { label: "Silver", emoji: "🥈", bg: "from-slate-50 to-gray-50", border: "border-slate-200", accent: "text-slate-600", pill: "bg-slate-100 text-slate-700 border-slate-200" },
    bronze: { label: "Bronze", emoji: "🥉", bg: "from-orange-50 to-amber-50", border: "border-orange-200", accent: "text-orange-600", pill: "bg-orange-100 text-orange-700 border-orange-200" },
    participant: { label: "Participant", emoji: "🏅", bg: "from-indigo-50 to-blue-50", border: "border-indigo-200", accent: "text-indigo-600", pill: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};

export default async function MyResultsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
    if (profile?.role !== "student") redirect("/dashboard");

    // Fetch all badges for this student
    const { data: badges } = await supabase
        .from("badges")
        .select("*")
        .eq("student_id", user.id)
        .order("issued_at", { ascending: false });

    // Fetch detailed scores for each result
    const { data: results } = await supabase
        .from("submission_results")
        .select(`
            id, weighted_score, rank, tier, computed_at,
            submissions!inner(title, event_id, events(title, results_status))
        `)
        .eq("student_id", user.id)
        .order("computed_at", { ascending: false });

    const goldCount = badges?.filter(b => b.tier === "gold").length || 0;
    const silverCount = badges?.filter(b => b.tier === "silver").length || 0;
    const bronzeCount = badges?.filter(b => b.tier === "bronze").length || 0;
    const totalScore = results?.reduce((sum, r) => sum + (parseFloat(r.weighted_score) || 0), 0) || 0;
    const avgScore = results?.length ? (totalScore / results.length).toFixed(1) : "—";

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-black font-outfit uppercase tracking-tight">
                    My <span className="text-primary italic">Results</span>
                </h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                    Achievement Portfolio · {badges?.length || 0} Badges Earned
                </p>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Gold Badges", value: goldCount, emoji: "🥇", color: "amber" },
                    { label: "Silver Badges", value: silverCount, emoji: "🥈", color: "slate" },
                    { label: "Bronze Badges", value: bronzeCount, emoji: "🥉", color: "orange" },
                    { label: "Avg Score", value: avgScore, emoji: "⭐", color: "indigo" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border-2 rounded-3xl p-5 space-y-3">
                        <div className="text-2xl">{stat.emoji}</div>
                        <div className="text-3xl font-black font-outfit">{stat.value}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* No badges state */}
            {(!badges || badges.length === 0) && (
                <div className="text-center py-24 border-2 border-dashed rounded-3xl space-y-4">
                    <div className="text-5xl">🎖️</div>
                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No Badges Yet</p>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                        Participate in competitions and earn badges when results are published by the administrator.
                    </p>
                    <Link href="/competitions">
                        <Button className="mt-2 rounded-xl h-11 font-black uppercase text-xs tracking-widest">
                            View Competitions <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Badges Grid */}
            {badges && badges.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> Your Badges
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {badges.map((badge: any) => {
                            const tier = badge.tier as keyof typeof TIER_CONFIG;
                            const cfg = TIER_CONFIG[tier] || TIER_CONFIG.participant;
                            const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://competeedu.in"}/verify/${badge.credential_id}`;
                            const issueDate = new Date(badge.issued_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

                            return (
                                <div key={badge.id} className={`rounded-[2rem] border-2 ${cfg.border} bg-gradient-to-br ${cfg.bg} overflow-hidden group hover:shadow-xl transition-all duration-300`}>
                                    {/* Badge Image Preview */}
                                    <div className="relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`/api/badge/${badge.credential_id}`}
                                            alt={`${badge.tier} badge`}
                                            className="w-full object-cover"
                                        />
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.pill}`}>
                                                    {cfg.emoji} {cfg.label}
                                                </div>
                                                <p className="font-black text-slate-900 text-sm mt-2 leading-tight">{badge.event_name}</p>
                                                <p className="text-slate-400 text-xs font-medium">{issueDate}</p>
                                            </div>
                                            {badge.rank && (
                                                <div className={`text-3xl font-black font-outfit ${cfg.accent}`}>#{badge.rank}</div>
                                            )}
                                        </div>

                                        {/* Score bar */}
                                        {badge.weighted_score && (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>Score</span>
                                                    <span className={cfg.accent}>{parseFloat(badge.weighted_score).toFixed(1)}/100</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${tier === "gold" ? "bg-amber-400" : tier === "silver" ? "bg-slate-400" : tier === "bronze" ? "bg-orange-400" : "bg-indigo-400"}`}
                                                        style={{ width: `${Math.min(100, parseFloat(badge.weighted_score))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Credential */}
                                        <code className="block text-[9px] font-mono text-slate-400 bg-white/60 px-3 py-2 rounded-xl border border-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {badge.credential_id}
                                        </code>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-1">
                                            <Link href={`/verify/${badge.credential_id}`} target="_blank" className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full h-9 rounded-xl border-slate-200 font-bold text-[9px] uppercase tracking-widest gap-1.5">
                                                    <QrCode className="w-3 h-3" /> Verify
                                                </Button>
                                            </Link>
                                            <a href={`/api/badge/${badge.credential_id}`} download target="_blank" rel="noopener noreferrer" className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full h-9 rounded-xl border-slate-200 font-bold text-[9px] uppercase tracking-widest gap-1.5">
                                                    <Download className="w-3 h-3" /> Download
                                                </Button>
                                            </a>
                                            <BadgeShareButtons credentialId={badge.credential_id} studentName={badge.student_name} eventName={badge.event_name} tier={badge.tier} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Score breakdown if any results published */}
            {results && results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-indigo-500" /> Score History
                    </h2>
                    <div className="bg-white rounded-3xl border-2 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {results.map((result: any) => {
                                const tier = result.tier as keyof typeof TIER_CONFIG;
                                const cfg = TIER_CONFIG[tier] || TIER_CONFIG.participant;
                                return (
                                    <div key={result.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                                        <div className="text-2xl">{cfg.emoji}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 text-sm truncate">{(result.submissions as any)?.events?.title}</p>
                                            <p className="text-xs text-slate-400 font-medium">{(result.submissions as any)?.title}</p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            {result.rank && <span className="text-lg font-black font-outfit text-slate-400">#{result.rank}</span>}
                                            <span className={`text-lg font-black font-outfit ${cfg.accent}`}>{parseFloat(result.weighted_score).toFixed(1)}</span>
                                            <Badge className={`text-[9px] font-black uppercase rounded-full px-3 border ${cfg.pill}`}>{cfg.label}</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
