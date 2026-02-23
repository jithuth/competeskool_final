import { createClient } from "@/lib/supabase/server";
import { Plus, School as SchoolIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SchoolForm } from "@/components/dashboard/schools/SchoolForm";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/schools/columns";

export default async function SchoolsPage() {
    const supabase = await createClient();
    const { data: schools } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-outfit bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Educational Institutions
                    </h1>
                    <p className="text-muted-foreground">Manage school registrations and approvals.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-purple-600">
                            <Plus className="mr-2 h-4 w-4" /> Add School
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New School</DialogTitle>
                            <DialogDescription>
                                Manually register a school and its administrator.
                            </DialogDescription>
                        </DialogHeader>
                        <SchoolForm />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={columns}
                data={schools || []}
                searchKey="name"
                filters={[
                    { column: "address", title: "Location" }
                ]}
            />
        </div>
    );
}
