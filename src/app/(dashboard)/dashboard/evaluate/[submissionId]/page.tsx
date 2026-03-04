import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { redirect, notFound } from "next/navigation";
import { JudgeScoringForm } from "@/components/dashboard/evaluate/JudgeScoringForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MediaPlayer } from "@/components/shared/MediaPlayer";
import { Query } from "node-appwrite";

export default async function EvaluateSubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
    const { submissionId } = await params;

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

    if (profile?.role !== "judge" && profile?.role !== "super_admin") redirect("/dashboard");

    // Get submission details
    let submission: any = null;
    try {
        submission = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "submissions", submissionId);
    } catch (e) {
        notFound();
    }

    if (!submission) notFound();

    // Fetch relations
    let event: any = {};
    let student: any = {};
    let videos: any[] = [];

    try {
        event = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "events", submission.event_id);
    } catch (e) { }

    try {
        student = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", submission.student_id);
        if (student.school_id) {
            try {
                student.schools = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "schools", student.school_id);
            } catch (e) { }
        }
    } catch (e) { }

    try {
        const videosRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_videos", [
            Query.equal("submission_id", submission.$id)
        ]);
        videos = JSON.parse(JSON.stringify(videosRes.documents));
    } catch (e) { }

    // Get rubric criteria for this event
    let criteria: any[] = [];
    try {
        const criteriaRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "evaluation_criteria", [
            Query.equal("event_id", event.$id),
            // TODO: fix sort if sorting column doesnt work
            Query.orderAsc("display_order")
        ]);
        criteria = JSON.parse(JSON.stringify(criteriaRes.documents));
    } catch (e) { }

    // Get existing scores by this judge
    let existingScores: any[] = [];
    try {
        const scoresRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submission_scores", [
            Query.equal("submission_id", submissionId),
            Query.equal("judge_id", user.$id)
        ]);
        existingScores = JSON.parse(JSON.stringify(scoresRes.documents));
    } catch (e) { }

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
                                    <MediaPlayer key={v.$id} video={v} poster={event.banner_url || ""} />
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
                            Submitted {new Date(submission.$createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
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
                                isReadOnly={profile?.role !== "judge"}
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
