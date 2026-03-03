import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Trophy, BarChart3, Medal, Settings2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Query } from "node-appwrite";

const TIER_CONFIG = {
    gold: { label: "Gold", emoji: "🥇", pill: "bg-amber-100 text-amber-700 border-amber-200" },
    silver: { label: "Silver", emoji: "🥈", pill: "bg-slate-100 text-slate-600 border-slate-200" },
    bronze: { label: "Bronze", emoji: "🥉", pill: "bg-orange-100 text-orange-700 border-orange-200" },
    participant: { label: "Participant", emoji: "🏅", pill: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    not_started: { label: "Not Started", color: "bg-slate-100 text-slate-600" },
    scoring_open: { label: "Scoring Open", color: "bg-blue-100 text-blue-700" },
    scoring_locked: { label: "Locked", color: "bg-amber-100 text-amber-700" },
    review: { label: "Under Review", color: "bg-purple-100 text-purple-700" },
    published: { label: "Published", color: "bg-emerald-100 text-emerald-700" },
};

export default async function ResultsPage() {
    let user;
    try {
        const { account } = await createSessionClient();
        user = await account.get();
    } catch (e) {
        redirect("/login");
    }

    if (!user) redirect("/login");

    const adminAppwrite = getAppwriteAdmin();

    let profile: any = null;
    try {
        profile = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
    } catch (e) { }

    if (profile?.role !== "super_admin") redirect("/dashboard");

    // All events with results status
    let events: any[] = [];
    try {
        const evsRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "events", [
            Query.orderDesc("$createdAt")
        ]);
        events = evsRes.documents;
    } catch (e) { }

    // Published results leaderboard
    let topResults: any[] = [];
    try {
        // We order by weighted score descending, limit 50
        const topRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_results", [
            Query.orderDesc("weighted_score"),
            Query.limit(50)
        ]);

        topResults = await Promise.all(
            topRes.documents.map(async (res: any) => {
                let p = null;
                let ev = null;

                try {
                    p = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", res.student_id);
                    if (p && p.school_id) {
                        try {
                            const s = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "schools", p.school_id);
                            p.schools = s;
                        } catch (e) { }
                    }
                } catch (e) { }

                // To get the event, we need the submission
                try {
                    const sub = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "submissions", res.submission_id);
                    if (sub) {
                        ev = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "events", sub.event_id);
                    }
                } catch (e) { }

                return {
                    ...res,
                    id: res.$id,
                    profiles: p,
                    events: ev,
                };
            })
        );
    } catch (e) { }

    // Badge stats
    let totalBadges = 0;
    let goldBadges = 0;
    try {
        const bAll = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "badges");
        totalBadges = bAll.total;

        const bGold = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "badges", [
            Query.equal("tier", "gold")
        ]);
        goldBadges = bGold.total;
    } catch (e) { }

    let publishedEvents = 0;
    let pendingEvents = 0;
    try {
        const pEvs = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "events", [
            Query.equal("results_status", "published")
        ]);
        publishedEvents = pEvs.total;

        const penEvs = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "events", [
            Query.equal("results_status", ["scoring_open", "review", "scoring_locked"])
        ]);
        pendingEvents = penEvs.total;
    } catch (e) { }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-black font-outfit uppercase tracking-tight">
                    Results <span className="text-primary italic">& Badges</span>
                </h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                    Platform-wide results management and credential overview
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Badges Issued", value: totalBadges || 0, icon: Medal, color: "indigo" },
                    { label: "Gold Badges", value: goldBadges || 0, icon: Trophy, color: "amber" },
                    { label: "Published Events", value: publishedEvents || 0, icon: BarChart3, color: "emerald" },
                    { label: "Events in Progress", value: pendingEvents || 0, icon: Settings2, color: "blue" },
                ].map((stat: any) => (
                    <div key={stat.label} className="bg-white border-2 rounded-3xl p-6 space-y-3">
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                        <div className="text-3xl font-black font-outfit">{stat.value}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Events Result Status */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Events — Results Pipeline</h2>
                <div className="bg-white rounded-3xl border-2 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {events?.map((event: any) => {
                            const statusCfg = STATUS_CONFIG[event.results_status] || STATUS_CONFIG.not_started;
                            return (
                                <div key={event.$id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-slate-900 text-sm truncate">{event.title}</p>
                                        {event.results_published_at && (
                                            <p className="text-xs text-slate-400 font-medium">
                                                Published: {new Date(event.results_published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        )}
                                    </div>
                                    <Badge className={`${statusCfg.color} font-black text-[9px] uppercase tracking-widest rounded-full shrink-0`}>
                                        {statusCfg.label}
                                    </Badge>
                                    <Link href={`/dashboard/events/${event.$id}/scoring`}>
                                        <Button variant="outline" size="sm" className="h-8 rounded-xl font-bold text-[9px] uppercase tracking-widest gap-1.5 shrink-0">
                                            <Settings2 className="w-3 h-3" /> Manage
                                        </Button>
                                    </Link>
                                    {event.results_status === "published" && (
                                        <Link href={`/events/${event.$id}/results`} target="_blank">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-indigo-600">
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                        {(!events || events.length === 0) && (
                            <div className="p-10 text-center text-slate-400 text-sm font-medium">No events found</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Leaderboard */}
            {topResults && topResults.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> Global Leaderboard (Top Performers)
                    </h2>
                    <div className="bg-white rounded-3xl border-2 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {topResults.map((result: any, index: number) => {
                                const tier = result.tier as keyof typeof TIER_CONFIG;
                                const cfg = TIER_CONFIG[tier] || TIER_CONFIG.participant;
                                return (
                                    <div key={result.id} className={`flex items-center gap-4 px-6 py-4 ${index < 3 ? "bg-amber-50/40" : ""} hover:bg-slate-50 transition-colors`}>
                                        <div className="w-8 text-center">
                                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : (
                                                <span className="text-sm font-black text-slate-300">#{index + 1}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 text-sm">{(result.profiles as any)?.full_name}</p>
                                            <p className="text-xs text-slate-400 font-medium truncate">{(result.profiles as any)?.schools?.name} · {(result.events as any)?.title}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xl font-black font-outfit text-slate-700">
                                                {parseFloat(result.weighted_score).toFixed(1)}
                                                <span className="text-xs text-slate-300 font-normal">/100</span>
                                            </span>
                                            <Badge className={`text-[9px] font-black uppercase rounded-full px-3 border ${cfg.pill}`}>
                                                {cfg.emoji} {cfg.label}
                                            </Badge>
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
