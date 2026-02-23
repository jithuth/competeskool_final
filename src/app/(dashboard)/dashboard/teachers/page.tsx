import { createClient } from "@/lib/supabase/server";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TeacherForm } from "@/components/dashboard/teachers/TeacherForm";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/teachers/columns";
import { redirect } from "next/navigation";

export default async function TeachersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
        redirect("/dashboard");
    }

    let query = supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          status,
          created_at,
          schools (name),
          teachers (class_section)
        `)
        .eq("role", "teacher");

    if (profile.role === 'school_admin') {
        query = query.eq("school_id", profile.school_id);
    }

    const { data: teachers } = await query;

    const formattedTeachers = teachers?.map((t: any) => ({
        id: t.id,
        full_name: t.full_name,
        email: t.email,
        status: t.status,
        created_at: t.created_at,
        school_name: t.schools?.name || "N/A",
        class_section: Array.isArray(t.teachers) ? t.teachers[0]?.class_section || "" : t.teachers?.class_section || "",
    })) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-outfit text-gradient">Teachers Management</h1>
                    <p className="text-muted-foreground">Manage educators in your school.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-purple-600">
                            <UserPlus className="mr-2 h-4 w-4" /> Register Teacher
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Register New Teacher</DialogTitle>
                            <DialogDescription>
                                Create an account for a new teacher in your school.
                            </DialogDescription>
                        </DialogHeader>
                        <TeacherForm schoolId={profile.school_id!} />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={columns}
                data={formattedTeachers}
                searchKey="full_name"
                filters={[
                    { column: "school_name", title: "School Name" },
                    { column: "class_section", title: "Class & Section" }
                ]}
            />
        </div>
    );
}
