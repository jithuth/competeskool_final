"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Play } from "lucide-react";

export function EvaluateDialog({ submission, onSuccess }: { submission: any, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(submission.score || "");
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const router = useRouter();
    const supabase = createClient();

    async function handleSave() {
        if (!score || isNaN(Number(score))) {
            toast.error("Please enter a valid score (0-100)");
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from("submissions")
            .update({
                score: Number(score),
                feedback,
                status: 'reviewed'
            })
            .eq("id", submission.id);

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        toast.success("Evaluation saved!");
        onSuccess();
        router.refresh();
    }

    const video = submission.submission_videos?.[0];

    return (
        <div className="space-y-6 pt-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                {video?.type === 'youtube' ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${video.youtube_url.split('v=')[1]}`}
                        className="w-full h-full"
                        allowFullScreen
                    />
                ) : (
                    <video src={video?.video_url} className="w-full h-full" controls />
                )}
            </div>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="score">Score (0-100)</Label>
                    <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="Enter score"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide constructive feedback for the student..."
                        className="h-32"
                    />
                </div>
                <Button className="w-full h-11" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Evaluation"}
                </Button>
            </div>
        </div>
    );
}
