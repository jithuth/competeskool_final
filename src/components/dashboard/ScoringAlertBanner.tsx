import Link from "next/link";
import { AlertTriangle, Clock, ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface EventAlert {
    id: string;
    title: string;
    end_date: string;
    scoring_deadline: string | null;
    results_status: string;
    daysOverdue: number;
}

export function ScoringAlertBanner({ events }: { events: EventAlert[] }) {
    if (events.length === 0) return null;

    const urgent = events.filter(e => e.daysOverdue > 7);
    const normal = events.filter(e => e.daysOverdue <= 7);

    return (
        <div className="space-y-3 mb-8">
            {urgent.length > 0 && (
                <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-100 flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-red-800 uppercase tracking-widest">
                            ⚡ {urgent.length} Event{urgent.length > 1 ? "s" : ""} Urgently Need Evaluation Setup
                        </p>
                        <p className="text-xs text-red-600 font-medium mt-1">
                            Scoring deadline has passed. Set up rubric and open scoring immediately.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {urgent.map(e => (
                                <Link key={e.id} href={`/dashboard/events/${e.id}/scoring`}>
                                    <Button size="sm" className="h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest gap-1.5">
                                        <ClipboardList className="w-3 h-3" /> {e.title} <ArrowRight className="w-3 h-3" />
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {normal.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-start gap-4">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-amber-800 uppercase tracking-widest">
                            🕐 {normal.length} Event{normal.length > 1 ? "s" : ""} Awaiting Evaluation Setup
                        </p>
                        <p className="text-xs text-amber-700 font-medium mt-1">
                            Submission phase ended. Build the rubric, assign judges, and open scoring within the 15-day window.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {normal.map(e => (
                                <Link key={e.id} href={`/dashboard/events/${e.id}/scoring`}>
                                    <Button size="sm" className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest gap-1.5">
                                        <ClipboardList className="w-3 h-3" />
                                        {e.title}
                                        {e.scoring_deadline && (
                                            <span className="opacity-70">
                                                · Due {formatDistanceToNow(new Date(e.scoring_deadline), { addSuffix: true })}
                                            </span>
                                        )}
                                        <ArrowRight className="w-3 h-3" />
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
