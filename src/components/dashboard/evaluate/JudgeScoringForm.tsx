"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { saveScoresAction } from "@/app/actions/evaluation";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Star, MessageSquare, ChevronRight } from "lucide-react";

interface Criterion {
    id: string;
    title: string;
    description: string;
    max_score: number;
    weight: number;
}

interface ScoreEntry {
    criterion_id: string;
    score: number;
    feedback: string;
}

interface JudgeScoringFormProps {
    submissionId: string;
    criteria: Criterion[];
    existingScores: ScoreEntry[];
    eventTitle: string;
    submissionTitle: string;
    studentName: string;
    isLocked: boolean;
}

export function JudgeScoringForm({
    submissionId,
    criteria,
    existingScores,
    eventTitle,
    submissionTitle,
    studentName,
    isLocked
}: JudgeScoringFormProps) {
    const [scores, setScores] = useState<ScoreEntry[]>(
        criteria.map(c => {
            const existing = existingScores.find(s => s.criterion_id === c.id);
            return {
                criterion_id: c.id,
                score: existing?.score ?? Math.floor(c.max_score / 2),
                feedback: existing?.feedback ?? "",
            };
        })
    );
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedTotal = criteria.reduce((sum, c, i) => {
        return sum + (scores[i].score / c.max_score) * (c.weight / totalWeight) * 100;
    }, 0);

    const updateScore = (index: number, score: number) => {
        setScores(prev => prev.map((s, i) => i === index ? { ...s, score } : s));
    };

    const updateFeedback = (index: number, feedback: string) => {
        setScores(prev => prev.map((s, i) => i === index ? { ...s, feedback } : s));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const res = await saveScoresAction(submissionId, scores);
        setLoading(false);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Scores saved successfully!");
        router.refresh();
    };

    const activeCriterion = criteria[activeIndex];
    const activeScore = scores[activeIndex];
    const scorePercentage = activeCriterion ? (activeScore.score / activeCriterion.max_score) * 100 : 0;

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return "text-emerald-600";
        if (pct >= 60) return "text-blue-600";
        if (pct >= 40) return "text-amber-600";
        return "text-red-500";
    };

    return (
        <div className="space-y-6">
            {/* Context Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-sm">
                <p className="font-black text-indigo-800 uppercase tracking-widest text-[10px] mb-1">{eventTitle}</p>
                <p className="font-bold text-indigo-700">{submissionTitle}</p>
                <p className="text-indigo-500 text-xs font-medium">by {studentName}</p>
            </div>

            {/* Criterion Navigation */}
            <div className="flex gap-2 flex-wrap">
                {criteria.map((c, i) => {
                    const pct = (scores[i].score / c.max_score) * 100;
                    return (
                        <button
                            key={c.id}
                            onClick={() => setActiveIndex(i)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeIndex === i ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {scores[i].feedback && <CheckCircle2 className="w-2.5 h-2.5 opacity-70" />}
                            {c.title.split(" ")[0]}
                            <span className={`font-black ${activeIndex === i ? "text-indigo-200" : getScoreColor(pct)}`}>
                                {scores[i].score}/{c.max_score}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Active Criterion Scoring */}
            {activeCriterion && (
                <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-black text-xl text-slate-900">{activeCriterion.title}</h3>
                            {activeCriterion.description && (
                                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{activeCriterion.description}</p>
                            )}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                            <div className={`text-4xl font-black font-outfit ${getScoreColor(scorePercentage)}`}>
                                {activeScore.score}
                            </div>
                            <div className="text-xs font-bold text-slate-400">/ {activeCriterion.max_score} pts</div>
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-wider mt-0.5">
                                Weight: {activeCriterion.weight}%
                            </div>
                        </div>
                    </div>

                    {/* Score Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>0</span>
                            <span>{Math.floor(activeCriterion.max_score / 2)}</span>
                            <span>{activeCriterion.max_score}</span>
                        </div>

                        {isLocked ? (
                            <div className="relative h-4">
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${scorePercentage}%` }} />
                                </div>
                            </div>
                        ) : (
                            <Slider
                                min={0}
                                max={activeCriterion.max_score}
                                step={0.5}
                                value={[activeScore.score]}
                                onValueChange={([val]: number[]) => updateScore(activeIndex, val)}
                                className="cursor-pointer"
                            />
                        )}

                        {/* Visual Score Indicator */}
                        <div className="flex justify-center">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-6 h-6 transition-all ${i < Math.ceil(scorePercentage / 20) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" /> Feedback (Optional)
                        </label>
                        <Textarea
                            value={activeScore.feedback}
                            onChange={e => updateFeedback(activeIndex, e.target.value)}
                            placeholder="Specific observations on this criterion..."
                            className="rounded-xl min-h-[80px] resize-none text-sm"
                            rows={3}
                            disabled={isLocked}
                        />
                    </div>

                    {/* Navigate to next */}
                    {activeIndex < criteria.length - 1 && (
                        <Button
                            variant="outline"
                            onClick={() => setActiveIndex(i => i + 1)}
                            className="w-full rounded-xl h-10 font-bold text-xs uppercase tracking-widest"
                        >
                            Next: {criteria[activeIndex + 1].title} <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            )}

            {/* Summary + Submit */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Projected Weighted Score</span>
                    <span className={`text-3xl font-black font-outfit ${getScoreColor(weightedTotal)}`}>
                        {weightedTotal.toFixed(1)}<span className="text-base text-slate-400">/100</span>
                    </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${weightedTotal}%` }} />
                </div>

                {!isLocked && (
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 font-black uppercase tracking-widest text-xs transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Submit Evaluation
                    </Button>
                )}
                {isLocked && (
                    <Badge className="w-full justify-center h-10 rounded-xl bg-amber-100 text-amber-700 font-black text-xs uppercase tracking-widest">
                        Scoring Locked by Administrator
                    </Badge>
                )}
            </div>
        </div>
    );
}
