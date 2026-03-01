"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveRubricAction } from "@/app/actions/evaluation";
import { Plus, Trash2, GripVertical, Loader2, Sparkles, Save, Scale } from "lucide-react";
import { useRouter } from "next/navigation";

interface Criterion {
    id?: string;
    title: string;
    description: string;
    max_score: number;
    weight: number;
    display_order: number;
}

const PRESETS = [
    {
        name: "Creative Arts",
        criteria: [
            { title: "Creativity & Originality", description: "Uniqueness and innovative thinking", max_score: 25, weight: 30 },
            { title: "Technical Skill", description: "Mastery of the medium and technique", max_score: 25, weight: 30 },
            { title: "Presentation", description: "Quality of delivery and communication", max_score: 20, weight: 25 },
            { title: "Theme Adherence", description: "How well the work fits the given theme", max_score: 10, weight: 15 },
        ]
    },
    {
        name: "Science & Tech",
        criteria: [
            { title: "Innovation", description: "Novelty of idea or approach", max_score: 30, weight: 35 },
            { title: "Technical Accuracy", description: "Correctness and precision", max_score: 30, weight: 35 },
            { title: "Clarity of Explanation", description: "How well the concept is presented", max_score: 20, weight: 20 },
            { title: "Practicality", description: "Real-world applicability", max_score: 10, weight: 10 },
        ]
    },
    {
        name: "Performing Arts",
        criteria: [
            { title: "Stage Presence", description: "Confidence and engagement", max_score: 25, weight: 25 },
            { title: "Technical Proficiency", description: "Skill level in the performance", max_score: 30, weight: 30 },
            { title: "Expressiveness", description: "Emotional depth and connection", max_score: 25, weight: 25 },
            { title: "Overall Impact", description: "Lasting impression on the audience", max_score: 20, weight: 20 },
        ]
    }
];

export function RubricBuilder({ eventId, initialCriteria }: { eventId: string; initialCriteria: Criterion[] }) {
    const [criteria, setCriteria] = useState<Criterion[]>(
        initialCriteria.length > 0 ? initialCriteria : []
    );
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    const isValid = criteria.length > 0 && Math.abs(totalWeight - 100) < 0.01;

    const addCriterion = () => {
        const remaining = Math.max(0, 100 - totalWeight);
        setCriteria(prev => [...prev, {
            title: "",
            description: "",
            max_score: 10,
            weight: remaining,
            display_order: prev.length,
        }]);
    };

    const updateCriterion = (index: number, field: keyof Criterion, value: any) => {
        setCriteria(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    };

    const removeCriterion = (index: number) => {
        setCriteria(prev => prev.filter((_, i) => i !== index));
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setCriteria(preset.criteria.map((c, i) => ({ ...c, display_order: i })));
        toast.success(`Applied "${preset.name}" preset`);
    };

    const handleSave = async () => {
        if (!isValid) {
            toast.error(`Weights must total exactly 100%. Current total: ${totalWeight.toFixed(1)}%`);
            return;
        }
        if (criteria.some(c => !c.title.trim())) {
            toast.error("All criteria must have a title");
            return;
        }
        setLoading(true);
        const res = await saveRubricAction(eventId, criteria.map((c, i) => ({ ...c, display_order: i })));
        setLoading(false);
        if (res.error) { toast.error(res.error); return; }
        toast.success("Evaluation rubric saved successfully");
        router.refresh();
    };

    return (
        <div className="space-y-8">
            {/* Presets */}
            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Quick Start Presets
                </Label>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-xs font-black uppercase tracking-wider transition-all"
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weight Indicator */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 flex items-center gap-4">
                <Scale className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1">
                    <div className="flex justify-between text-xs font-black mb-2">
                        <span className="text-slate-500 uppercase tracking-widest">Total Weight Distribution</span>
                        <span className={totalWeight === 100 ? "text-emerald-600" : totalWeight > 100 ? "text-red-600" : "text-amber-600"}>
                            {totalWeight.toFixed(1)}% / 100%
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${totalWeight > 100 ? "bg-red-500" : totalWeight === 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(100, totalWeight)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-4">
                {criteria.map((criterion, index) => (
                    <div key={index} className="group relative bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-100 p-6 transition-all space-y-4">
                        <div className="flex items-start gap-3">
                            <GripVertical className="w-4 h-4 text-slate-300 mt-3 shrink-0" />
                            <div className="flex-1 space-y-4">
                                <div className="grid md:grid-cols-3 gap-4 items-end">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Criterion {index + 1}</Label>
                                        <Input
                                            value={criterion.title}
                                            onChange={e => updateCriterion(index, "title", e.target.value)}
                                            placeholder="e.g. Creativity & Originality"
                                            className="h-11 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Score</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={criterion.max_score}
                                                onChange={e => updateCriterion(index, "max_score", parseInt(e.target.value) || 0)}
                                                className="h-11 rounded-xl text-center font-black"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weight %</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={criterion.weight}
                                                onChange={e => updateCriterion(index, "weight", parseFloat(e.target.value) || 0)}
                                                className="h-11 rounded-xl text-center font-black"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description / Scoring Guide</Label>
                                    <Textarea
                                        value={criterion.description}
                                        onChange={e => updateCriterion(index, "description", e.target.value)}
                                        placeholder="What should judges look for when scoring this criterion?"
                                        className="rounded-xl min-h-[60px] resize-none text-sm"
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => removeCriterion(index)}
                                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addCriterion}
                    className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Criterion
                </button>
            </div>

            {/* Validation message */}
            {criteria.length > 0 && !isValid && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                    ⚠️ Weights must add up to exactly 100% before saving. Currently: {totalWeight.toFixed(1)}%
                </div>
            )}

            {/* Save */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={loading || criteria.length === 0}
                    className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-indigo-600 font-black uppercase tracking-widest text-xs gap-2 transition-all"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Rubric
                </Button>
            </div>
        </div>
    );
}
