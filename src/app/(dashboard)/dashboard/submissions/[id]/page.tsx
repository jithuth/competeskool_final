import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { Calendar, User, Trophy, ArrowLeft, Video, ExternalLink, MessageSquare, Download, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, school_id")
        .eq("id", user.id)
        .single();

    if (!profile) redirect("/dashboard");

    const { data: submission, error } = await supabase
        .from("submissions")
        .select(`
            *,
            events (*, schools(name)),
            profiles (full_name, email, school_id, schools(name)),
            submission_videos (*)
        `)
        .eq("id", id)
        .single();

    if (error || !submission) notFound();

    // Access Control
    const isOwner = submission.student_id === user.id;
    const isSuperAdmin = profile.role === 'super_admin';
    const isJudge = profile.role === 'judge';
    const isSchoolAdmin = profile.role === 'school_admin' && profile.school_id === submission.profiles?.school_id;

    // For now, simplify access: Only owner, judge, super_admin, or school_admin of that school can see it
    if (!isOwner && !isSuperAdmin && !isJudge && !isSchoolAdmin) {
        notFound();
    }

    const video = submission.submission_videos?.[0];
    const isPending = submission.status === 'pending';
    const isReviewed = submission.status === 'reviewed';

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <Link href="/dashboard/my-submissions" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors gap-2 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to List
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className="capitalize px-4 py-1 text-[10px] font-black tracking-widest rounded-full" variant={isPending ? "secondary" : "default"}>
                                {submission.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Submitted {format(new Date(submission.created_at), "MMM dd, yyyy")}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black font-outfit uppercase tracking-tight text-slate-800">
                            {submission.title}
                        </h1>
                        <p className="text-xl text-primary font-bold font-outfit mt-1">
                            Competition: {submission.events?.title}
                        </p>
                    </div>
                </div>

                {(isSuperAdmin || isJudge) && isPending && (
                    <Link href={`/dashboard/evaluate`}>
                        <Button className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-purple-600 shadow-xl shadow-primary/20 hover:scale-105 transition-all text-lg font-bold">
                            Review & Score Now
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Media & Description */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="rounded-[2.5rem] overflow-hidden border-2 shadow-2xl shadow-slate-200/50">
                        <div className="aspect-video bg-black relative group">
                            {video?.type === 'youtube' ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${video.youtube_url?.split('v=')[1]}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            ) : video?.video_url ? (
                                <video
                                    src={video.video_url}
                                    className="w-full h-full"
                                    controls
                                    poster={submission.events?.banner_url || ""}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/50 flex-col gap-4">
                                    <Video className="w-16 h-16 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Media content unavailable</p>
                                </div>
                            )}
                        </div>
                        <CardHeader className="p-10">
                            <CardTitle className="text-2xl font-outfit font-black uppercase tracking-tight">Project Story</CardTitle>
                            <Separator className="my-4" />
                            <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                {submission.description}
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Feedback Section (if reviewed) */}
                    {isReviewed && (
                        <Card className="rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <MessageSquare className="w-24 h-24 text-primary" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                <div className="shrink-0 text-center space-y-2">
                                    <div className="w-24 h-24 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-xl shadow-primary/10">
                                        <span className="text-3xl font-black text-primary">{Math.round(submission.score)}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Final Score</p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-outfit font-black uppercase tracking-tight text-primary flex items-center gap-2">
                                        <CheckCircle2 className="w-6 h-6" /> Judges Verdict
                                    </h3>
                                    <p className="text-lg text-slate-700 italic leading-relaxed">
                                        "{submission.feedback || "Great potential! We look forward to your future innovations."}"
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right: Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[2rem] border-2 overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Participant Profile</h3>
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/5">
                                    <User className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-800">{submission.profiles?.full_name}</p>
                                    <p className="text-sm text-muted-foreground font-medium">{submission.profiles?.schools?.name}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Student ID</span>
                                    <span className="font-mono text-slate-600 font-bold">{submission.student_id.slice(0, 8)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Competition</span>
                                    <span className="text-right font-bold text-slate-800">{submission.events?.title}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Media Type</span>
                                    <Badge variant="outline" className="font-black uppercase text-[9px] h-6">{submission.submission_videos?.[0]?.type || 'N/A'}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-2 overflow-hidden bg-slate-900 text-white shadow-xl shadow-slate-900/20">
                        <CardHeader className="p-8 pb-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                            <CardTitle className="text-xl font-outfit font-black uppercase tracking-tight">Competition Rewards</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Winners of {submission.events?.title} are eligible for national recognition and mentorship programs.
                            </p>
                            <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold uppercase text-[10px] tracking-widest h-11">
                                View Full Rules
                            </Button>
                        </CardContent>
                    </Card>

                    {video?.video_url && (
                        <Button className="w-full h-14 rounded-[1.5rem] gap-3 font-bold text-lg shadow-lg hover:shadow-primary/20" variant="outline">
                            <Download className="w-5 h-5" /> Download Entry
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
