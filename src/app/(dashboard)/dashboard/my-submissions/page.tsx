import { createClient } from "@/lib/supabase/server";
import { Plus, Video, Rocket, CheckCircle2, Sparkles, Target } from "lucide-react";
import { SubmissionsTable } from "@/components/dashboard/submissions/SubmissionsTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmissionWizard } from "@/components/dashboard/submissions/SubmissionWizard";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MySubmissionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

    const { data: submissions } = await supabase
        .from("submissions")
        .select(`
      *,
      events (title),
      submission_videos (*)
    `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

    // Fetch events accessible to the student
    const eventsQuery = supabase
        .from("events")
        .select("*, schools(name)")
        .eq("status", "active");

    if (profile?.school_id) {
        eventsQuery.or(`is_private.eq.false,school_id.eq.${profile.school_id}`);
    } else {
        eventsQuery.eq("is_private", false);
    }

    const { data: activeEvents } = await eventsQuery;

    const availableEvents = activeEvents?.filter(e => !submissions?.some(s => s.event_id === e.id)) || [];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black font-outfit uppercase tracking-tight text-slate-900 leading-none">Active Events</h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Deployment Center & Logs</p>
            </div>

            {/* Available Arenas Section */}
            {availableEvents.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black font-outfit uppercase tracking-tight">Available Arenas</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {availableEvents.map((event) => (
                            <Card key={event.id} className="rounded-[2.5rem] overflow-hidden border-2 hover:border-primary/30 transition-all group bg-white shadow-sm hover:shadow-xl">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge className="bg-slate-100 text-slate-800 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                                            {event.media_type} competition
                                        </Badge>
                                        <Target className="w-5 h-5 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <CardTitle className="text-2xl font-black font-outfit uppercase leading-tight mb-2 group-hover:text-primary transition-colors">
                                        {event.title}
                                    </CardTitle>
                                    <div
                                        className="line-clamp-2 text-slate-500 font-medium leading-relaxed text-sm h-10 overflow-hidden"
                                        dangerouslySetInnerHTML={{ __html: event.description || "" }}
                                    />
                                </CardHeader>
                                <CardContent className="px-8 pb-8 pt-4">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-primary transition-all font-black uppercase tracking-widest text-xs gap-3">
                                                Enter Arena <Rocket className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-6xl rounded-[3rem] overflow-hidden p-0 border-2 border-slate-50 shadow-2xl bg-white/95 backdrop-blur-xl">
                                            <DialogHeader className="p-8 pb-0">
                                                <DialogTitle className="text-3xl font-black font-outfit uppercase flex items-center gap-3">
                                                    <Target className="w-8 h-8 text-primary" /> {event.title}
                                                </DialogTitle>
                                                <DialogDescription className="text-slate-500 font-medium">
                                                    Complete the following steps to submit your project for evaluation.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="p-8">
                                                <SubmissionWizard events={availableEvents} initialEventId={event.id} />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {availableEvents.length === 0 && (
                <div className="py-24 text-center border-4 border-dashed rounded-[3rem] bg-slate-50/50">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-emerald-500/50" />
                    <h2 className="text-3xl font-black font-outfit uppercase tracking-tight text-slate-400">All Done!</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">You've entered all available competitions.</p>
                </div>
            )}
        </div>
    );
}
