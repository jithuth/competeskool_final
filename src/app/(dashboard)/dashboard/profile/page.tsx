import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SecuritySettings } from "@/components/dashboard/settings/SecuritySettings";
import { GeneralProfileSettings } from "@/components/dashboard/settings/GeneralProfileSettings";
import { User, ShieldIcon } from "lucide-react";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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
