import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { JudgesManager } from "@/components/dashboard/judges/JudgesManager";
import { Query } from "node-appwrite";

export default async function JudgesPage() {
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

    if (profile?.role !== "super_admin") redirect("/dashboard");

    let judgesRaw: any[] = [];
    try {
        const res = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "profiles", [
            Query.equal("role", "judge"),
            Query.orderDesc("$createdAt")
        ]);

        for (const doc of res.documents) {
            try {
                const judgeRes = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "judges", [
                    Query.equal("profile_id", doc.$id)
                ]);
                doc.judges = judgeRes.documents;
            } catch (e) {
                doc.judges = [];
            }
        }
        judgesRaw = res.documents;
    } catch (e) { }

    const judges = (judgesRaw || []).map((j: any) => ({
        id: j.$id,
        full_name: j.full_name || "",
        email: j.email || "",
        status: j.status,
        created_at: j.$createdAt,
        expertise: j.judges?.[0]?.expertise || "",
        bio: j.judges?.[0]?.bio || "",
    }));

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <JudgesManager initialJudges={judges} />
        </div>
    );
}
