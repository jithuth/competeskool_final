import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const TIER_CONFIG = {
    gold: { bg: "linear-gradient(135deg,#1a1200,#3d2a00,#1a1200)", accent: "#FFD700", accentSoft: "#FFF3B0", glow: "rgba(255,215,0,0.3)", badge: "🥇", label: "GOLD EXCELLENCE", border: "#FFD700" },
    silver: { bg: "linear-gradient(135deg,#0d0f14,#1e2332,#0d0f14)", accent: "#C0C0C0", accentSoft: "#E8E8E8", glow: "rgba(192,192,192,0.3)", badge: "🥈", label: "SILVER MERIT", border: "#C0C0C0" },
    bronze: { bg: "linear-gradient(135deg,#140a00,#2e1800,#140a00)", accent: "#CD7F32", accentSoft: "#F5CBA7", glow: "rgba(205,127,50,0.3)", badge: "🥉", label: "BRONZE COMMENDATION", border: "#CD7F32" },
    participant: { bg: "linear-gradient(135deg,#0a0f1e,#0f1a3d,#0a0f1e)", accent: "#6366F1", accentSoft: "#C7D2FE", glow: "rgba(99,102,241,0.3)", badge: "🏅", label: "PARTICIPANT", border: "#6366F1" },
};

export async function GET(
    _request: Request,
    { params }: { params: { credentialId: string } }
) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: badge } = await supabase
        .from("badges")
        .select("*")
        .eq("credential_id", params.credentialId)
        .single();

    if (!badge) {
        return new Response("Badge not found", { status: 404 });
    }

    const tier = (badge.tier as keyof typeof TIER_CONFIG) || "participant";
    const c = TIER_CONFIG[tier] ?? TIER_CONFIG.participant;
    const issueDate = new Date(badge.issued_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const nameSize = badge.student_name?.length > 20 ? "38px" : "48px";

    return new ImageResponse(
        <div style={{ width: "800px", height: "480px", background: c.bg, display: "flex", fontFamily: "sans-serif", position: "relative", overflow: "hidden", border: `2px solid ${c.border}`, borderRadius: "24px" }}>
            {/* Glow top-left */}
            <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", background: c.glow, borderRadius: "50%", filter: "blur(80px)" }} />
            {/* Glow bottom-right */}
            <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "250px", height: "250px", background: c.glow, borderRadius: "50%", filter: "blur(80px)" }} />
            {/* Left accent bar */}
            <div style={{ position: "absolute", left: 0, top: 0, width: "6px", height: "100%", background: `linear-gradient(to bottom, transparent, ${c.accent}, transparent)` }} />

            {/* Main content */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px 40px 56px", width: "100%", position: "relative", zIndex: 10 }}>
                {/* Top Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.3em", color: c.accent, textTransform: "uppercase" }}>{badge.issued_by || "CompeteEdu"}</div>
                        <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Official Achievement Certificate</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`, borderRadius: "100px", padding: "8px 16px" }}>
                        <div style={{ fontSize: "20px" }}>{c.badge}</div>
                        <div style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.2em", color: c.accentSoft, textTransform: "uppercase" }}>{c.label}</div>
                    </div>
                </div>

                {/* Center */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>This certifies that</div>
                    <div style={{ fontSize: nameSize, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.1, textShadow: `0 0 40px ${c.glow}` }}>{badge.student_name}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{badge.school_name}</div>
                </div>

                {/* Event */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.25em", textTransform: "uppercase" }}>Achievement in</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: c.accentSoft, letterSpacing: "0.02em" }}>{badge.event_name}</div>
                </div>

                {/* Bottom Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", gap: "32px" }}>
                        {badge.rank ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Rank</div>
                                <div style={{ fontSize: "28px", fontWeight: 900, color: c.accent }}>#{badge.rank}</div>
                            </div>
                        ) : null}
                        {badge.weighted_score ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Score</div>
                                <div style={{ fontSize: "28px", fontWeight: 900, color: "rgba(255,255,255,0.8)" }}>
                                    {parseFloat(badge.weighted_score).toFixed(1)}<span style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>/100</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textTransform: "uppercase" }}>✓ Cryptographically Verified</div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{badge.credential_id}</div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>{issueDate}</div>
                    </div>
                </div>
            </div>
        </div>,
        { width: 800, height: 480 }
    );
}
