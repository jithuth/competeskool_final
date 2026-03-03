import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TeacherForm } from "@/components/dashboard/teachers/TeacherForm";
import { redirect } from "next/navigation";
import { Query } from "node-appwrite";
import { TeachersDataTable } from "./TeachersDataTable";

export default async function TeachersPage() {
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

    if (!profile || (profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
        redirect("/dashboard");
    }

    const schoolId = profile?.school_id;

    let queries = [
        Query.equal("role", "teacher"),
        Query.orderDesc("$createdAt")
    ];

    let schoolsList: { id: string, name: string }[] = [];
    if (profile.role === 'super_admin') {
        try {
            const sData = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "schools", [
                Query.equal("status", "approved"),
                Query.orderAsc("name")
            ]);

            schoolsList = sData.documents.map(s => ({
                id: s.$id,
                name: s.name
            }));
        } catch (e) { }
    }

    if (profile.role === 'school_admin') {
        if (!schoolId) {
            console.error("School Admin has no school_id!");
        } else {
            queries.push(Query.equal("school_id", schoolId));
        }
    }

    let teachersRaw: any[] = [];
    try {
        const tRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", queries);
        teachersRaw = tRes.documents;
    } catch (e) { }

    const formattedTeachers = await Promise.all(
        teachersRaw.map(async (t: any) => {
            let schoolName = "N/A";
            if (t.school_id) {
                try {
                    const sc = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "schools", t.school_id);
                    schoolName = sc.name;
                } catch (e) { }
            }

            let teacherData: any = null;
            try {
                // Assuming document id of teacher is equivalent to profile id
                teacherData = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "teachers", t.$id);
            } catch (e) { }

            return {
                id: t.$id,
                full_name: t.full_name,
                email: t.email,
                status: t.status,
                created_at: t.$createdAt,
                school_name: schoolName,
                class_section: teacherData?.class_section || "N/A",
            };
        })
    );

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
                        <TeacherForm schoolId={profile.school_id!} isSuperAdmin={profile.role === 'super_admin'} schools={schoolsList} />
                    </DialogContent>
                </Dialog>
            </div>

            <TeachersDataTable
                isSuperAdmin={profile.role === 'super_admin'}
                schoolsList={schoolsList}
                formattedTeachers={formattedTeachers}
            />
        </div>
    );
}
