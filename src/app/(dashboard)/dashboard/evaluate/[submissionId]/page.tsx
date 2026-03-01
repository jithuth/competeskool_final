import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { JudgeScoringForm } from "@/components/dashboard/evaluate/JudgeScoringForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MediaPlayer } from "@/components/shared/MediaPlayer";

export default async function EvaluateSubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
    const { submissionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "judge" && profile?.role !== "super_admin") redirect("/dashboard");

    // Get submission details
    const { data: submission } = await supabase
        .from("submissions")
        .select(`
            id, title, description, created_at, student_id,
            events!submissions_event_id_fkey(id, title, results_status),
            profiles!submissions_student_id_fkey(full_name, email, schools(name)),
            submission_videos(*)
        `)
        .eq("id", submissionId)
        .single();

    if (!submission) notFound();

    const event = (submission as any).events;
    const student = (submission as any).profiles;
    const videos: any[] = (submission as any).submission_videos || [];

    // Get rubric criteria for this event
    const { data: criteria } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .eq("event_id", event.id)
        .order("display_order");

    // Get existing scores by this judge
    const { data: existingScores } = await supabase
        .from("submission_scores")
        .select("criterion_id, score, feedback")
        .eq("submission_id", submissionId)
        .eq("judge_id", user.id);

    const isLocked = ["scoring_locked", "published"].includes(event.results_status);
    const noCriteria = !criteria || criteria.length === 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500">
            {/* Breadcrumb */}
            <div className="space-y-4">
                <Link href="/dashboard/evaluate" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Evaluations
                </Link>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black font-outfit leading-tight line-clamp-2">{submission.title || "Untitled Submission"}</h1>
                        <p className="text-slate-400 text-sm font-medium mt-1">
                            {student?.full_name} · {student?.schools?.name}
                        </p>
                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider mt-1">{event.title}</p>
                    </div>
                    {isLocked && (
                        <Badge className="shrink-0 bg-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest rounded-full px-4 py-2">
                            Scoring Locked
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* LEFT: Submission Preview */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] border-2 p-6 space-y-4">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Submission Content</h2>

                        {/* Videos/Media */}
                        {videos.length > 0 ? (
                            <div className="space-y-3">
                                {videos.map((v: any) => (
                                    <MediaPlayer key={v.id} video={v} />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl bg-slate-50 text-center text-slate-400 text-sm">
                                No media attached
                            </div>
                        )}

                        {/* Description */}
                        {submission.description && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{submission.description}</p>
                            </div>
                        )}

                        <div className="pt-2 border-t text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                            Submitted {new Date(submission.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Scoring Form */}
                <div>
                    {noCriteria ? (
                        <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-8 text-center space-y-3">
                            <p className="font-black text-amber-700 uppercase tracking-widest text-sm">No Rubric Defined</p>
                            <p className="text-amber-600 text-sm">The administrator has not set up evaluation criteria for this event yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border-2 p-6">
                            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Your Evaluation</h2>
                            <JudgeScoringForm
                                submissionId={submissionId}
                                criteria={criteria!}
                                existingScores={(existingScores || []) as any}
                                eventTitle={event.title}
                                submissionTitle={submission.title || "Untitled"}
                                studentName={student?.full_name || "Unknown"}
                                isLocked={isLocked}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function extractYouTubeId(url: string): string {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    return match ? match[1] : "";
}
