import { createClient } from "@/lib/supabase/server";
import { Plus, Video, ExternalLink, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SubmissionWizard } from "@/components/dashboard/submissions/SubmissionWizard";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MySubmissionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: submissions } = await supabase
        .from("submissions")
        .select(`
      *,
      events (title),
      submission_videos (*)
    `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

    const { data: activeEvents } = await supabase
        .from("events")
        .select("id, title")
        .eq("status", "active");

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-outfit text-gradient">My Submissions</h1>
                    <p className="text-muted-foreground font-medium">Track your competition entries and results.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20 hover:scale-105 transition-transform h-11 px-6">
                            <Plus className="mr-2 h-4 w-4" /> New Submission
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl overflow-y-auto max-h-[95vh] rounded-[2rem]">
                        <DialogHeader className="pt-6 px-4">
                            <DialogTitle className="text-3xl font-outfit font-bold flex items-center gap-3">
                                <Rocket className="w-8 h-8 text-primary" /> Start Your Entry
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Follow the steps to showcase your project to the judges.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-6">
                            <SubmissionWizard events={activeEvents || []} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {submissions && submissions.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {submissions.map((sub: any) => (
                        <Card key={sub.id} className="group hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5 overflow-hidden border-2 bg-card rounded-[1.5rem]">
                            <div className="aspect-video bg-muted relative group-hover:opacity-90 transition-opacity">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-muted-foreground/30" />
                                </div>
                                {sub.submission_videos?.[0]?.type === 'youtube' && (
                                    <div className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-xl shadow-lg">
                                        <ExternalLink className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <CardHeader className="p-6">
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <Badge className="capitalize text-[10px] px-3 font-bold tracking-widest h-6 rounded-full" variant={
                                        sub.status === 'pending' ? 'secondary' :
                                            sub.status === 'reviewed' ? 'default' : 'outline'
                                    }>
                                        {sub.status}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{new Date(sub.created_at).toLocaleDateString()}</span>
                                </div>
                                <CardTitle className="text-xl font-outfit font-bold leading-tight line-clamp-1">{sub.title}</CardTitle>
                                <CardDescription className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
                                    {sub.events?.title}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">
                                    {sub.description}
                                </p>
                                {sub.score ? (
                                    <div className="mt-6 p-4 rounded-2xl bg-primary/5 flex justify-between items-center border border-primary/10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">Judges Score</span>
                                            <span className="text-2xl font-black text-primary">{sub.score}<span className="text-sm text-primary/40">/100</span></span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                                            <span className="text-[10px] font-bold">{Math.round(sub.score)}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 p-4 rounded-2xl bg-muted/30 text-center border border-dashed">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest italic">Awaiting Review</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center border-4 border-dashed rounded-[3rem] bg-muted/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Video className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-3xl font-bold font-outfit mb-2">Ready to shine?</h3>
                        <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto font-light">Your dashboard is empty. Step into the spotlight by entering your first competition.</p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="lg" className="rounded-2xl h-14 px-10 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 shadow-2xl shadow-primary/20">
                                    Create Submission <Rocket className="ml-2 w-5 h-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl overflow-y-auto max-h-[95vh] rounded-[2rem]">
                                <DialogHeader className="pt-6 px-4">
                                    <DialogTitle className="text-3xl font-outfit font-bold flex items-center gap-3">
                                        <Rocket className="w-8 h-8 text-primary" /> Start Your Entry
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="p-6">
                                    <SubmissionWizard events={activeEvents || []} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}
        </div>
    );
}
