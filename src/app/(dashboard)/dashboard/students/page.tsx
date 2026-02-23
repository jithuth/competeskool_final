import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/students/columns";
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

    // Fetch students based on role
    let query = supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            email,
            status,
            created_at,
            schools (name),
            students!inner (
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
        // School admins see everyone in their school
        query = query.eq("school_id", profile.school_id);
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
            <div>
                <h1 className="text-3xl font-bold font-outfit text-gradient">Students Directory</h1>
                <p className="text-muted-foreground">
                    {profile.role === 'teacher'
                        ? "Approve and manage students in your school."
                        : "Monitor student registrations across institutions."}
                </p>
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
