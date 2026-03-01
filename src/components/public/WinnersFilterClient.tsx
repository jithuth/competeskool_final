"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, QrCode, Filter, Trophy, Medal } from "lucide-react";

const TIER_CONFIG = {
    gold: {
        label: "Gold", emoji: "🥇",
        cardBg: "bg-gradient-to-br from-amber-950/60 to-yellow-950/40",
        border: "border-amber-500/20 hover:border-amber-400/40",
        accent: "text-amber-400",
        pill: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        accentBar: "from-amber-500 to-yellow-400",
    },
    silver: {
        label: "Silver", emoji: "🥈",
        cardBg: "bg-gradient-to-br from-slate-900/80 to-slate-800/50",
        border: "border-slate-500/20 hover:border-slate-400/40",
        accent: "text-slate-300",
        pill: "bg-slate-500/20 text-slate-300 border-slate-500/30",
        accentBar: "from-slate-400 to-slate-300",
    },
    bronze: {
        label: "Bronze", emoji: "🥉",
        cardBg: "bg-gradient-to-br from-orange-950/60 to-amber-950/40",
        border: "border-orange-500/20 hover:border-orange-400/40",
        accent: "text-orange-400",
        pill: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        accentBar: "from-orange-500 to-amber-400",
    },
};

interface BadgeData {
    id: string;
    credential_id: string;
    tier: string;
    student_name: string;
    school_name: string;
    event_name: string;
    rank: number | null;
    weighted_score: number | null;
    issued_at: string;
}

const TIER_ORDER = ["gold", "silver", "bronze"];
type TierFilter = "all" | "gold" | "silver" | "bronze";

export function WinnersFilterClient({ badges, eventNames }: { badges: BadgeData[]; eventNames: string[] }) {
    const [tierFilter, setTierFilter] = useState<TierFilter>("all");
    const [eventFilter, setEventFilter] = useState<string>("all");

    const filtered = useMemo(() => {
        return badges
            .filter(b => tierFilter === "all" || b.tier === tierFilter)
            .filter(b => eventFilter === "all" || b.event_name === eventFilter)
            .sort((a, b) => {
                const tierDiff = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
                if (tierDiff !== 0) return tierDiff;
                return (a.rank || 999) - (b.rank || 999);
            });
    }, [badges, tierFilter, eventFilter]);

    const goldCount = filtered.filter(b => b.tier === "gold").length;
    const silverCount = filtered.filter(b => b.tier === "silver").length;
    const bronzeCount = filtered.filter(b => b.tier === "bronze").length;

    return (
        <div className="space-y-10">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
                {/* Tier Filter */}
                <div className="flex gap-2 flex-wrap">
                    {(["all", "gold", "silver", "bronze"] as TierFilter[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTierFilter(t)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${tierFilter === t
                                ? t === "gold" ? "bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20"
                                    : t === "silver" ? "bg-slate-400 text-black border-slate-400"
                                        : t === "bronze" ? "bg-orange-500 text-white border-orange-500"
                                            : "bg-white text-slate-900 border-white"
                                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {t === "gold" ? "🥇 " : t === "silver" ? "🥈 " : t === "bronze" ? "🥉 " : ""}
                            {t === "all" ? "All Winners" : t}
                        </button>
                    ))}
                </div>

                {/* Event Filter */}
                {eventNames.length > 1 && (
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-slate-500" />
                        <select
                            value={eventFilter}
                            onChange={e => setEventFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 text-slate-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        >
                            <option value="all">All Events</option>
                            {eventNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Summary Counts */}
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
                <span className="text-amber-400">🥇 {goldCount} Gold</span>
                <span className="text-slate-300">🥈 {silverCount} Silver</span>
                <span className="text-orange-400">🥉 {bronzeCount} Bronze</span>
                <span className="text-slate-500">/ {filtered.length} Total</span>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-600 font-medium">
                    No winners match the selected filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((badge, index) => {
                        const tier = badge.tier as keyof typeof TIER_CONFIG;
                        const cfg = TIER_CONFIG[tier];
                        if (!cfg) return null;
                        const issueDate = new Date(badge.issued_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

                        return (
                            <div
                                key={badge.id}
                                className={`group relative ${cfg.cardBg} backdrop-blur-sm rounded-[2rem] p-8 border ${cfg.border} transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] overflow-hidden`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Top accent bar */}
                                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.accentBar} opacity-60`} />

                                {/* Glow orb */}
                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                                    style={{ background: tier === "gold" ? "#FFD700" : tier === "silver" ? "#C0C0C0" : "#CD7F32" }}
                                />

                                <div className="relative z-10 space-y-6">
                                    {/* Tier Badge + Rank */}
                                    <div className="flex items-start justify-between">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.pill}`}>
                                            {cfg.emoji} {cfg.label}
                                        </span>
                                        {badge.rank && (
                                            <span className={`text-3xl font-black font-outfit ${cfg.accent}`}>#{badge.rank}</span>
                                        )}
                                    </div>

                                    {/* Name + School */}
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black font-outfit text-white uppercase tracking-tight leading-tight group-hover:text-amber-50 transition-colors">
                                            {badge.student_name}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {badge.school_name}
                                        </p>
                                    </div>

                                    {/* Score bar */}
                                    {badge.weighted_score && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                <span>Score</span>
                                                <span className={cfg.accent}>{parseFloat(String(badge.weighted_score)).toFixed(1)}/100</span>
                                            </div>
                                            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                                <div className={`h-full rounded-full bg-gradient-to-r ${cfg.accentBar}`}
                                                    style={{ width: `${Math.min(100, parseFloat(String(badge.weighted_score)))}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Event */}
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Competition</p>
                                        <p className="text-xs font-bold text-slate-300 leading-tight">{badge.event_name}</p>
                                        <p className="text-[9px] text-slate-600 mt-0.5">{issueDate}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link href={`/verify/${badge.credential_id}`} className="flex-1">
                                            <Button size="sm" className="w-full h-9 rounded-xl text-[9px] font-black uppercase tracking-widest gap-1 bg-white/10 hover:bg-white/20 text-white border-0">
                                                <Shield className="w-3 h-3" /> Verify
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
