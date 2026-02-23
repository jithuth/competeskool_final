import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EvaluateDialog } from "@/components/dashboard/evaluate/EvaluateDialog";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function EvaluatePage() {
    const supabase = await createClient();
    const { data: submissions } = await supabase
        .from("submissions")
        .select(`
      *,
      events (title),
      profiles (full_name, school_id),
      submission_videos (*)
    `)
        .order("status", { ascending: false }) // Show pending first
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-outfit">Evaluation Center</h1>
                    <p className="text-muted-foreground">Review and score student submissions from all schools.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input className="pl-9 w-[300px]" placeholder="Search submissions..." />
                    </div>
                    <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                </div>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Submission</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions && submissions.length > 0 ? (
                            submissions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="font-medium">{sub.profiles?.full_name}</div>
                                        <div className="text-xs text-muted-foreground">ID: {sub.student_id.slice(0, 8)}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{sub.events?.title}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{sub.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={sub.status === 'pending' ? 'secondary' : 'default'} className="capitalize">
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {sub.score !== null ? `${sub.score}/100` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant={sub.status === 'pending' ? 'default' : 'outline'} size="sm">
                                                    {sub.status === 'pending' ? 'Evaluate' : 'Edit Score'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                                                <DialogHeader>
                                                    <DialogTitle>Evaluate Submission</DialogTitle>
                                                    <DialogDescription>
                                                        Reviewing entry by {sub.profiles?.full_name} for {sub.events?.title}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <EvaluateDialog submission={sub} onSuccess={() => { }} />
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No submissions available for review.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
