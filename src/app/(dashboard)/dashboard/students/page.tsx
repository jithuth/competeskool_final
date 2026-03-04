import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { Users, GraduationCap, CheckCircle, Clock } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/students/columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Query } from "node-appwrite";

export default async function StudentsPage() {
    let user;
    try {
        const { account } = await createSessionClient();
        user = await account.get();
    } catch (e) {
        redirect("/login");
    }

    if (!user) redirect("/login");

    const adminAppwrite = getAppwriteAdmin();

    let profile: any = null;
    try {
        profile = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
    } catch (e) { }

    if (!profile) redirect("/dashboard");

    const schoolId = profile?.school_id;

    // Fetch students based on role
    let queries = [
        Query.equal("role", "student"),
        Query.orderDesc("$createdAt")
    ];

    if (profile.role === 'school_admin') {
        if (!schoolId) {
            console.error("School Admin has no school_id!");
        } else {
            queries.push(Query.equal("school_id", schoolId));
        }
    }

    let studentsRaw: any[] = [];
    try {
        const studRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", queries);
        studentsRaw = studRes.documents;
    } catch (e) { }

    let formattedStudents = await Promise.all(
        studentsRaw.map(async (s: any) => {
            let schoolName = "N/A";
            if (s.school_id) {
                try {
                    const sc = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "schools", s.school_id);
                    schoolName = sc.name;
                } catch (e) { }
            }

            let studentInfo: any = null;
            let teacherProfile: any = null;

            try {
                // Should use `Query.equal("profile_id", s.$id)` depending on how students collection maps to profiles
                // We'll assume the student document ID is the profile ID as per convention
                studentInfo = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "students", s.$id);

                if (studentInfo && studentInfo.teacher_id) {
                    try {
                        teacherProfile = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", studentInfo.teacher_id);
                    } catch (e) { }
                }
            } catch (e) { }

            return {
                id: s.$id,
                full_name: s.full_name,
                email: s.email,
                status: s.status,
                created_at: s.$createdAt,
                school_name: schoolName,
                teacher_name: teacherProfile?.full_name || "N/A",
                grade_level: studentInfo?.grade_level || "N/A",
                teacher_id: studentInfo?.teacher_id,
                phone: studentInfo?.phone || "N/A",
                father_name: studentInfo?.father_name || "N/A",
                mother_name: studentInfo?.mother_name || "N/A",
            };
        })
    );

    // Filter for teachers
    if (profile.role === 'teacher') {
        formattedStudents = formattedStudents.filter(s => s.teacher_id === user.$id);
    }

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
