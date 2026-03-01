import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, Shield, ExternalLink, Award, Calendar, Hash, School, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import crypto from "crypto";

const TIER_CONFIG = {
    gold: { label: "Gold Excellence Award", emoji: "🥇", bg: "from-yellow-950 to-amber-900", accent: "text-amber-400", border: "border-amber-500/30", badge_bg: "bg-amber-500/10" },
    silver: { label: "Silver Merit Award", emoji: "🥈", bg: "from-slate-900 to-slate-800", accent: "text-slate-300", border: "border-slate-500/30", badge_bg: "bg-slate-500/10" },
    bronze: { label: "Bronze Commendation", emoji: "🥉", bg: "from-orange-950 to-amber-950", accent: "text-orange-400", border: "border-orange-500/30", badge_bg: "bg-orange-500/10" },
    participant: { label: "Participation Award", emoji: "🏅", bg: "from-indigo-950 to-slate-900", accent: "text-indigo-400", border: "border-indigo-500/30", badge_bg: "bg-indigo-500/10" },
};

function verifyHash(badge: any): boolean {
    const secret = process.env.BADGE_SECRET || "competeedu-secret-2026";
    const payload = {
        credential_id: badge.credential_id,
        student_id: badge.student_id,
        event_id: badge.event_id,
        tier: badge.tier,
        rank: badge.rank,
        weighted_score: badge.weighted_score,
        issued_at: badge.issued_at,
    };
    const expected = crypto.createHash("sha256").update(JSON.stringify(payload) + secret).digest("hex");
    return expected === badge.credential_hash;
}

export async function generateMetadata({ params }: { params: Promise<{ credentialId: string }> }): Promise<Metadata> {
    const { credentialId } = await params;
    const supabase = await createClient();
    const { data: badge } = await supabase.from("badges").select("student_name, event_name, tier").eq("credential_id", credentialId).single();
    if (!badge) return { title: "Badge Not Found" };
    return {
        title: `${badge.student_name} — ${badge.event_name} | Verified Credential`,
        description: `Verify the ${badge.tier} achievement badge awarded to ${badge.student_name} for ${badge.event_name}.`,
        openGraph: {
            images: [`/api/badge/${credentialId}`],
            type: "website",
        },
        twitter: { card: "summary_large_image" },
    };
}

export default async function VerifyBadgePage({ params }: { params: Promise<{ credentialId: string }> }) {
    const { credentialId } = await params;
    const supabase = await createClient();
    const { data: badge } = await supabase.from("badges").select("*").eq("credential_id", credentialId).single();

    if (!badge) notFound();

    const isValid = verifyHash(badge);
    const tier = badge.tier as keyof typeof TIER_CONFIG;
    const cfg = TIER_CONFIG[tier] || TIER_CONFIG.participant;
    const issueDate = new Date(badge.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    return (
        <div className={`min-h-screen bg-gradient-to-br ${cfg.bg} flex items-center justify-center p-6 relative overflow-hidden`}>
            {/* Background glows */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/2 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/2 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 w-full max-w-2xl space-y-6">
                {/* Verification Status Banner */}
                <div className={`rounded-2xl p-5 flex items-center gap-4 border ${isValid ? "bg-emerald-950/60 border-emerald-500/30" : "bg-red-950/60 border-red-500/30"}`}>
                    {isValid ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    ) : (
                        <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                    )}
                    <div>
                        <p className={`font-black text-sm uppercase tracking-widest ${isValid ? "text-emerald-400" : "text-red-400"}`}>
                            {isValid ? "✓ Credential Verified" : "✗ Verification Failed"}
                        </p>
                        <p className="text-white/50 text-xs font-medium mt-0.5">
                            {isValid
                                ? "This badge is authentic and cryptographically verified. The credential data has not been tampered with."
                                : "This badge failed cryptographic verification. It may have been forged or tampered with."}
                        </p>
                    </div>
                </div>

                {/* Badge Card */}
                <div className={`rounded-3xl border ${cfg.border} bg-black/30 backdrop-blur-xl overflow-hidden`}>
                    {/* Badge Image */}
                    <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/badge/${badge.credential_id}`}
                            alt={`${badge.student_name}'s ${badge.tier} badge`}
                            className="w-full rounded-t-3xl"
                        />
                    </div>

                    {/* Details */}
                    <div className="p-8 space-y-6">
                        {/* Recipient */}
                        <div className="text-center space-y-2">
                            <div className="text-4xl">{cfg.emoji}</div>
                            <h1 className="text-3xl font-black text-white font-outfit">{badge.student_name}</h1>
                            <p className={`text-sm font-black uppercase tracking-widest ${cfg.accent}`}>{cfg.label}</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Award, label: "Event", value: badge.event_name },
                                { icon: School, label: "Institution", value: badge.school_name },
                                { icon: Star, label: tier !== "participant" ? "Score" : "Status", value: badge.weighted_score ? `${parseFloat(badge.weighted_score).toFixed(1)}/100` : "Completed" },
                                { icon: Calendar, label: "Issued", value: issueDate },
                            ].map((item) => (
                                <div key={item.label} className={`p-4 rounded-2xl ${cfg.badge_bg} border ${cfg.border}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <item.icon className={`w-3.5 h-3.5 ${cfg.accent}`} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{item.label}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white/80 leading-tight">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Rank if present */}
                        {badge.rank && (
                            <div className={`p-4 rounded-2xl ${cfg.badge_bg} border ${cfg.border} flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className={`text-3xl font-black font-outfit ${cfg.accent}`}>#{badge.rank}</div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Final Rank</p>
                                        <p className="text-xs font-bold text-white/60">Out of all participants</p>
                                    </div>
                                </div>
                                <Shield className={`w-8 h-8 ${cfg.accent} opacity-50`} />
                            </div>
                        )}

                        {/* Credential Hash */}
                        <div className="space-y-3 border-t border-white/10 pt-6">
                            <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Credential ID</span>
                            </div>
                            <code className="block text-xs font-mono text-white/50 break-all bg-black/20 p-3 rounded-xl">
                                {badge.credential_id}
                            </code>
                            <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">SHA-256 Hash</span>
                            </div>
                            <code className="block text-[10px] font-mono text-white/30 break-all bg-black/20 p-3 rounded-xl">
                                {badge.credential_hash}
                            </code>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link href="/" className="flex-1">
                                <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-white hover:bg-white/10 font-bold uppercase text-xs tracking-widest">
                                    <ExternalLink className="w-4 h-4 mr-2" /> Visit Platform
                                </Button>
                            </Link>
                            <a href={`/api/badge/${badge.credential_id}`} download={`${badge.credential_id}.png`} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <Button className={`w-full h-12 rounded-xl font-bold uppercase text-xs tracking-widest bg-gradient-to-r ${tier === "gold" ? "from-amber-600 to-yellow-500" : tier === "silver" ? "from-slate-500 to-slate-400" : tier === "bronze" ? "from-orange-600 to-amber-500" : "from-indigo-600 to-purple-600"}`}>
                                    Download Badge PNG
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/20 text-xs font-medium">
                    Credential verification is powered by SHA-256 cryptographic signing. This URL is the permanent proof of achievement.
                </p>
            </div>
        </div>
    );
}
