"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoteButtonProps {
    submissionId: string;
    initialCount: number;
    disabled?: boolean; // true when event is closed/locked
}

export function VoteButton({ submissionId, initialCount, disabled }: VoteButtonProps) {
    const [count, setCount] = useState(initialCount);
    const [voted, setVoted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleVote = async () => {
        if (voted || disabled || loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/vote/${submissionId}`, { method: "POST" });
            const data = await res.json();
            if (res.status === 409 || data.alreadyVoted) {
                toast.info("You've already voted for this submission.");
                setVoted(true);
                return;
            }
            if (!res.ok) {
                toast.error(data.error || "Voting failed");
                return;
            }
            setCount(data.voteCount ?? count + 1);
            setVoted(true);
            toast.success("Vote recorded! 🎉");
        } catch {
            toast.error("Could not record vote. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleVote}
            disabled={disabled || voted || loading}
            className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 text-xs font-black uppercase tracking-widest
                ${voted
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-400 cursor-default"
                    : disabled
                        ? "bg-slate-800/40 border-slate-700/40 text-slate-600 cursor-not-allowed"
                        : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-400 cursor-pointer"
                }`}
        >
            {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <Heart className={`w-3.5 h-3.5 transition-transform ${voted ? "fill-rose-400 scale-110" : "group-hover:scale-110"}`} />
            )}
            <span>{count.toLocaleString()}</span>
            {!disabled && !voted && <span className="text-[9px] opacity-50">Vote</span>}
        </button>
    );
}
