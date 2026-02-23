import { createClient } from "@/lib/supabase/server";
import { Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { JudgeForm } from "@/components/dashboard/judges/JudgeForm";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/judges/columns";
import { redirect } from "next/navigation";

export default async function JudgesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== 'super_admin') {
        redirect("/dashboard");
    }

    const { data: judges } = await supabase
        .from("profiles")
        .select(`
      id,
      full_name,
      email,
      status,
      created_at,
      judges (expertise)
    `)
        .eq("role", "judge");

    const formattedJudges = judges?.map((j: any) => ({
        id: j.id,
        full_name: j.full_name,
        email: j.email,
        status: j.status,
        created_at: j.created_at,
        expertise: j.judges?.[0]?.expertise || "N/A",
    })) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-outfit text-gradient">Judges Panel</h1>
                    <p className="text-muted-foreground">Manage competition experts and evaluators.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-purple-600">
                            <Hammer className="mr-2 h-4 w-4" /> Add Judge
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Add New Judge</DialogTitle>
                            <DialogDescription>
                                Invite an expert to join the judging panel.
                            </DialogDescription>
                        </DialogHeader>
                        <JudgeForm />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={columns}
                data={formattedJudges}
                searchKey="full_name"
            />
        </div>
    );
}
