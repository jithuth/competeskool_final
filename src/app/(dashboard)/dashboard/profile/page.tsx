import { createSessionClient, APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { SecuritySettings } from "@/components/dashboard/settings/SecuritySettings";
import { GeneralProfileSettings } from "@/components/dashboard/settings/GeneralProfileSettings";
import { User, ShieldIcon } from "lucide-react";

export default async function ProfilePage() {
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

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-10">
            <div className="space-y-2">
                <h1 className="text-4xl font-black font-outfit tracking-tight">My Profile</h1>
                <p className="text-slate-500 font-medium">Update your personal identity details and manage your password credentials.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border shadow-sm space-y-12">
                <GeneralProfileSettings profile={profile} />
                <div className="pt-8 border-t border-slate-100">
                    <SecuritySettings />
                </div>
            </div>
        </div>
    );
}
