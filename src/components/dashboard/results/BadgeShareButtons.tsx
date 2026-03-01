"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Share2, Linkedin, Link2, Check } from "lucide-react";

interface BadgeShareButtonsProps {
    credentialId: string;
    studentName: string;
    eventName: string;
    tier: string;
}

export function BadgeShareButtons({ credentialId, studentName, eventName, tier }: BadgeShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const verifyUrl = `${baseUrl}/verify/${credentialId}`;
    const tierEmoji = { gold: "🥇", silver: "🥈", bronze: "🥉", participant: "🏅" }[tier] || "🏅";
    const linkedinText = encodeURIComponent(
        `${tierEmoji} Proud to have earned the ${tier.toUpperCase()} award in "${eventName}"!\n\nVerify my credential: ${verifyUrl}\n\n#CompeteEdu #StudentAchievement #Education`
    );
    const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}&summary=${linkedinText}`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(verifyUrl);
        setCopied(true);
        toast.success("Verification link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(o => !o)}
                className="h-9 w-9 p-0 rounded-xl border-slate-200"
            >
                <Share2 className="w-3 h-3" />
            </Button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute bottom-10 right-0 z-20 bg-white rounded-2xl border-2 shadow-xl p-3 flex flex-col gap-2 min-w-[160px]">
                        <a href={linkedinShare} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                            <Button size="sm" className="w-full h-9 rounded-xl bg-[#0077B5] hover:bg-[#005e90] font-bold text-[9px] uppercase tracking-widest gap-1.5">
                                <Linkedin className="w-3 h-3" /> LinkedIn
                            </Button>
                        </a>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={copyLink}
                            className="w-full h-9 rounded-xl border-slate-200 font-bold text-[9px] uppercase tracking-widest gap-1.5"
                        >
                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Link2 className="w-3 h-3" />}
                            {copied ? "Copied!" : "Copy Link"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
