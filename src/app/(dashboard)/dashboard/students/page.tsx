import { createClient } from "@/lib/supabase/server";
import { Users, GraduationCap, CheckCircle, Clock } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/students/columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function StudentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", user.id)
        .single();

    if (!profile) redirect("/dashboard");

    const schoolId = profile?.school_id;

    // Fetch students based on role
    let query = supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            email,
            status,
            created_at,
            school_id,
            schools (name),
            students (
                grade_level,
                teacher_id,
                teachers (
                    profiles (full_name)
                )
            )
        `)
        .eq("role", "student");

    // Role-based filtering logic
    if (profile.role === 'teacher') {
        // Teachers only see their assigned students
        query = query.eq("students.teacher_id", user.id);
    } else if (profile.role === 'school_admin') {
        if (!schoolId) {
            console.error("School Admin has no school_id!");
        } else {
            query = query.eq("school_id", schoolId);
        }
    }

    const { data: students, error: queryError } = await query;
    if (queryError) console.error("Query Error:", queryError);

    const formattedStudents = students?.map((s: any) => {
        const studentInfo = Array.isArray(s.students) ? s.students[0] : s.students;
        const teacherProfile = studentInfo?.teachers?.profiles;

        return {
            id: s.id,
            full_name: s.full_name,
            email: s.email,
            status: s.status,
            created_at: s.created_at,
            school_name: s.schools?.name || "N/A",
            teacher_name: teacherProfile?.full_name || "N/A",
            grade_level: studentInfo?.grade_level || "N/A",
        };
    }) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black font-outfit uppercase tracking-tight text-slate-800">Students Directory</h1>
                    <p className="text-muted-foreground font-medium">
                        {profile.role === 'teacher'
                            ? "Approve and manage students in your assigned class."
                            : "Monitor student registrations across institutions."}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Card className="rounded-2xl border-2 shadow-sm min-w-[150px]">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Talent</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <p className="text-2xl font-black text-primary">{formattedStudents.length}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-[2rem] bg-indigo-50 border-2 border-indigo-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-800">{formattedStudents.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Students</p>
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-800">
                            {formattedStudents.filter(s => s.status === 'approved').length}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Verified</p>
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-amber-50 border-2 border-amber-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-800">
                            {formattedStudents.filter(s => s.status === 'pending').length}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pending</p>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={formattedStudents}
                searchKey="full_name"
                filters={[
                    { column: "school_name", title: "School Name" },
                    { column: "teacher_name", title: "Class Teacher" },
                    { column: "grade_level", title: "Grade" },
                ]}
            />
        </div>
    );
}
