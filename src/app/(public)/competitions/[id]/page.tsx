import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, ScrollText, Share2, Award, Info, ArrowLeft, Trophy, Clock, Video, Image as ImageIcon, Music, XCircle, Heart, ExternalLink } from "lucide-react";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoteButton } from "@/components/public/VoteButton";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = (await params).id;
    const supabase = await createClient();

    const { data: event } = await supabase
        .from("events")
        .select("*, schools(name)")
        .eq("id", id)
        .single();

    if (!event) return { title: "Event Not Found" };

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${event.title} | Student Awards Management`,
        description: event.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || "Join the competition and showcase your talent.",
        openGraph: {
            images: [event.banner_url || "", ...previousImages],
        },
    };
}

export default async function EventDetailPage({ params }: Props) {
    const id = (await params).id;
    const supabase = await createClient();

    const { data: event } = await supabase
        .from("events")
        .select("*, schools(name)")
        .eq("id", id)
        .single();

    if (!event) notFound();

    const { getCurrentUserAction } = await import("@/app/actions/session");
    const user = await getCurrentUserAction();
    const userSchoolId = user?.school_id;

    // Access control for private events removed so all events are public

    const isExpired = new Date(event.end_date) < new Date();
    const isPublished = event.results_status === "published";
    const votingOpen = isExpired && !["scoring_locked", "review", "published"].includes(event.results_status ?? "");

    // Fetch public submissions with vote counts
    const { data: submissionsRaw } = await supabase
        .from("submissions")
        .select(`
            id, title, description,
            profiles!submissions_student_id_fkey(full_name, schools(name)),
            submission_videos(type, youtube_url, vimeo_url, video_url)
        `)
        .eq("event_id", id)
        .order("created_at", { ascending: false });

    // Get vote counts per submission
    const submissionIds = submissionsRaw?.map(s => s.id) || [];
    const { data: voteCounts } = await supabase
        .from("submission_votes")
        .select("submission_id")
        .in("submission_id", submissionIds.length ? submissionIds : ["00000000-0000-0000-0000-000000000000"]);

    const voteCountMap = new Map<string, number>();
    for (const v of voteCounts || []) {
        voteCountMap.set(v.submission_id, (voteCountMap.get(v.submission_id) || 0) + 1);
    }

    const submissions = (submissionsRaw || []).map((s: any) => ({
        ...s,
        voteCount: voteCountMap.get(s.id) || 0,
    }));

    // Sort by votes descending for display
    submissions.sort((a: any, b: any) => b.voteCount - a.voteCount);

    return (
        <div className="min-h-screen bg-[#080B1A]">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                {event.banner_url ? (
                    <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <ScrollText className="w-20 h-20 text-slate-800" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080B1A] via-slate-900/40 to-transparent" />

                <div className="absolute inset-0 flex items-end">
                    <div className="container mx-auto px-6 pb-16">
                        <Link
                            href="/competitions"
                            className="inline-flex items-center text-white/70 hover:text-white mb-8 text-sm font-bold uppercase tracking-widest transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Competitions
                        </Link>

                        <div className="max-w-4xl space-y-6">
                            <div className="flex flex-wrap gap-3">
                                <Badge className="bg-primary/20 text-primary-foreground border-primary/20 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                    {event.status}
                                </Badge>
                                <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    {event.media_type === 'video' && <Video className="w-3.5 h-3.5" />}
                                    {event.media_type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                                    {event.media_type === 'audio' && <Music className="w-3.5 h-3.5" />}
                                    {event.media_type} submission
                                </Badge>
                                {isPublished && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                        <Trophy className="w-3.5 h-3.5" /> Results Published
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black font-outfit text-white uppercase tracking-tight leading-[0.9] drop-shadow-lg">
                                {event.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 -mt-10 relative z-10 pb-20">

                {/* RESULTS CTA — shown prominently when published */}
                {isPublished && (
                    <div className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Trophy className="w-8 h-8 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Official Results Available</p>
                                <h2 className="text-2xl font-black text-white font-outfit">Results &amp; Rankings are published!</h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">View the complete leaderboard, podium, and verify winner badges.</p>
                            </div>
                        </div>
                        <Link href={`/events/${event.id}/results`} className="shrink-0">
                            <Button className="h-14 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs gap-2 shadow-xl shadow-amber-500/20">
                                <Trophy className="w-4 h-4" /> View Full Results
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-xl shadow-primary/5 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timeline</p>
                                    <p className="text-xs font-bold text-white mt-1">
                                        {format(new Date(event.start_date), "dd MMM")} - {format(new Date(event.end_date), "dd MMM yyyy")}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-xl shadow-primary/5 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Results</p>
                                    <p className="text-xs font-bold text-white mt-1">
                                        {isPublished ? (
                                            <Link href={`/events/${event.id}/results`} className="text-amber-400 underline underline-offset-2">View Now</Link>
                                        ) : event.scoring_deadline ? (
                                            `Expected by ${format(new Date(event.scoring_deadline), "dd MMM yyyy")}`
                                        ) : "TBA"}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-xl shadow-primary/5 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline</p>
                                    <p className="text-xs font-bold text-white mt-1">
                                        {isExpired ? "Closed" : format(new Date(event.end_date), "PPP")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-xl shadow-primary/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-white">Brief Overview</h2>
                            </div>
                            <div
                                className="html-output prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: event.description || "" }}
                            />
                        </div>

                        {/* Rules */}
                        <div className="bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-10 shadow-2xl space-y-6 relative overflow-hidden border border-slate-800">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <Award className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-white">Competition Guidelines</h2>
                            </div>
                            <div
                                className="html-output prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium relative z-10"
                                dangerouslySetInnerHTML={{ __html: event.full_rules || "" }}
                            />
                        </div>

                        {/* PUBLIC SUBMISSIONS GALLERY — shown after event ends */}
                        {isExpired && submissions.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-white">Submissions Gallery</h2>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                                            {submissions.length} entries ·
                                            {votingOpen ? " Public voting open" : " Voting closed"}
                                        </p>
                                    </div>
                                    {votingOpen && (
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20">
                                            <Heart className="w-3.5 h-3.5 text-rose-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Vote for your favourite</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4">
                                    {submissions.map((sub: any, idx: number) => {
                                        const video = sub.submission_videos?.[0];
                                        const isYT = video?.type === "youtube" && video?.youtube_url;
                                        const ytId = isYT ? new URL(video.youtube_url).searchParams.get("v") || video.youtube_url.split("/").pop()?.split("?")[0] : null;

                                        return (
                                            <div key={sub.id} className="group bg-slate-900/40 rounded-[2rem] border border-slate-800 hover:border-indigo-500/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
                                                <div className="flex flex-col md:flex-row">
                                                    {/* Thumbnail */}
                                                    <div className="md:w-72 shrink-0 bg-slate-800 aspect-video md:aspect-auto relative overflow-hidden">
                                                        {ytId ? (
                                                            <img
                                                                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                                                                alt={sub.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Video className="w-10 h-10 text-slate-700" />
                                                            </div>
                                                        )}
                                                        {/* Rank badge for top 3 */}
                                                        {idx < 3 && (
                                                            <div className="absolute top-3 left-3 text-xl">
                                                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                                        <div className="space-y-2">
                                                            <h3 className="font-black text-white text-lg font-outfit">{sub.title || "Untitled Submission"}</h3>
                                                            <p className="text-slate-400 text-xs font-medium">
                                                                {sub.profiles?.full_name}
                                                                {sub.profiles?.schools?.name && ` · ${sub.profiles.schools.name}`}
                                                            </p>
                                                            {sub.description && (
                                                                <p className="text-slate-500 text-sm line-clamp-2">{sub.description}</p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-4">
                                                            <VoteButton
                                                                submissionId={sub.id}
                                                                initialCount={sub.voteCount}
                                                                disabled={!votingOpen}
                                                            />
                                                            {isYT && (
                                                                <a
                                                                    href={video.youtube_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" /> Watch
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-xl shadow-primary/5 sticky top-28">
                            <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-white mb-6 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-indigo-400" /> Participate
                            </h3>

                            <div className="space-y-4">
                                {isPublished ? (
                                    <>
                                        <p className="text-sm text-emerald-400 font-bold">✓ Results have been published!</p>
                                        <Link href={`/events/${event.id}/results`} className="block">
                                            <Button className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20">
                                                <Trophy className="w-4 h-4 mr-2" /> View Results
                                            </Button>
                                        </Link>
                                    </>
                                ) : isExpired ? (
                                    <>
                                        <p className="text-sm text-slate-400 font-medium">Submissions are closed. Results will be published soon.</p>
                                        {event.scoring_deadline && (
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                                Expected by {format(new Date(event.scoring_deadline), "dd MMM yyyy")}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-400 font-medium">
                                            To participate in this competition, please log in through your institutional portal.
                                        </p>
                                        <Link href="/login" className="block">
                                            <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                                                Login to Apply
                                            </Button>
                                        </Link>
                                    </>
                                )}

                                <div className="pt-6 border-t border-slate-800">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Institutional Requirements</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-2 text-xs font-bold text-slate-300">
                                            <span className="text-emerald-500 mt-0.5">✓</span> Open to all registered schools
                                        </li>
                                        <li className="flex items-start gap-2 text-xs font-bold text-slate-300">
                                            <span className="text-emerald-500 mt-0.5">✓</span> One entry per category
                                        </li>
                                        <li className="flex items-start gap-2 text-xs font-bold text-slate-300">
                                            <span className="text-emerald-500 mt-0.5">✓</span> Media must be {event.media_type} format
                                        </li>
                                        {votingOpen && (
                                            <li className="flex items-start gap-2 text-xs font-bold text-rose-300">
                                                <Heart className="w-4 h-4 text-rose-400 shrink-0" /> Public votes count toward final score (20%)
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
