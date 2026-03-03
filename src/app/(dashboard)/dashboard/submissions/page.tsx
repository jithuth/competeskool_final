import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { SubmissionsTable } from "@/components/dashboard/submissions/SubmissionsTable";
import { redirect } from "next/navigation";
import { Trophy, Search, Filter, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Query } from "node-appwrite";

export default async function SubmissionsRegistryPage() {
    let user;
    try {
        const { account } = await createSessionClient();
        user = await account.get();
    } catch (e) {
        redirect("/login");
    }

    if (!user) {
        redirect("/login");
    }

    const adminAppwrite = getAppwriteAdmin();

    // Fetch user profile to determine role
    let profile: any = null;
    try {
        const profileRaw = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", user.$id);
        profile = JSON.parse(JSON.stringify(profileRaw));
    } catch (e) { }

    // Fetch all submissions with events and profiles
    let submissions: any[] = [];
    try {
        const res = await adminAppwrite.databases.listDocuments(APPWRITE_DATABASE_ID, "submissions", [
            Query.orderDesc("$createdAt"), Query.limit(100)
        ]);

        submissions = JSON.parse(JSON.stringify(res.documents));

        for (const sub of submissions) {
            sub.id = sub.$id;
            try {
                const ev = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "events", sub.event_id);
                sub.events = { title: ev.title };
            } catch (e) { }

            try {
                const prf = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", sub.student_id);
                sub.profiles = { full_name: prf.full_name, avatar_url: prf.avatar_url };
            } catch (e) { }

            sub.created_at = sub.$createdAt;
        }
    } catch (e) { }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-8 bg-primary rounded-full" />
                        <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter text-slate-900 leading-none">
                            Submission <span className="text-primary italic">History</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] ml-4">
                        A complete list of all competition entries and project records
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find by Project or Competition..."
                            className="h-12 w-72 rounded-2xl bg-white border-slate-200 pl-10 font-bold text-xs focus:ring-primary/20 transition-all border-2"
                        />
                    </div>
                    <button className="h-12 w-12 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Quick Stats / Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-[2rem] bg-indigo-50/50 border-2 border-indigo-100/50 flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg shadow-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Total Submissions</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{submissions?.length || 0}</p>
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-emerald-50/50 border-2 border-emerald-100/50 flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg shadow-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Reviewed Entries</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">
                            {submissions?.filter((s: any) => s.status === 'reviewed').length || 0}
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100/50 flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg shadow-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                        <Search className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Competitions</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">
                            {new Set(submissions?.map((s: any) => s.event_id)).size}
                        </p>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-slate-50/30 p-8 rounded-[3rem] border-2 border-slate-50">
                <SubmissionsTable
                    submissions={submissions || []}
                    role={profile?.role || 'student'}
                />
            </div>
        </div>
    );
}
