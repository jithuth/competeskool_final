import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecuritySettings } from "@/components/dashboard/settings/SecuritySettings";
import { SchoolSettings } from "@/components/dashboard/settings/SchoolSettings";
import { TeacherSettings } from "@/components/dashboard/settings/TeacherSettings";
import { StudentSettings } from "@/components/dashboard/settings/StudentSettings";
import { GeneralProfileSettings } from "@/components/dashboard/settings/GeneralProfileSettings";
import { SystemSettings } from "@/components/dashboard/settings/SystemSettings";
import { getSiteSettings } from "@/lib/cms";
import { User, Settings as SettingsIcon, ShieldIcon } from "lucide-react";

export default async function SettingsPage(props: { searchParams: Promise<{ tab?: string }> }) {
    const searchParams = await props.searchParams;
    const defaultTab = searchParams.tab || "profile";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) redirect("/dashboard");

    const siteSettings = await getSiteSettings();

    // Fetch Role Specific Data
    let roleData = null;
    if (profile.role === 'school_admin') {
        const { data } = await supabase.from("schools").select("*").eq("id", profile.school_id).single();
        roleData = data;
    } else if (profile.role === 'teacher') {
        const { data } = await supabase.from("teachers").select("*").eq("id", profile.id).single();
        roleData = data;
    } else if (profile.role === 'student') {
        const { data } = await supabase.from("students").select("*").eq("id", profile.id).single();
        roleData = data;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-10">
            <div className="space-y-2">
                <h1 className="text-4xl font-black font-outfit tracking-tight">Account Settings</h1>
                <p className="text-slate-500 font-medium">Manage your profile, security, and application preferences.</p>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                <div className="flex justify-start mb-8 overflow-x-auto pb-2 custom-scrollbar">
                    <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto">
                        <TabsTrigger
                            value="profile"
                            className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all"
                        >
                            <User className="mr-2 w-4 h-4" /> Profile & Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all"
                        >
                            <ShieldIcon className="mr-2 w-4 h-4" /> Security
                        </TabsTrigger>
                        {profile.role === 'super_admin' && (
                            <TabsTrigger
                                value="system"
                                className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all"
                            >
                                <SettingsIcon className="mr-2 w-4 h-4" /> Global Settings
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border shadow-sm">
                    <TabsContent value="profile" className="mt-0 space-y-2 max-w-4xl">
                        <GeneralProfileSettings profile={profile} />
                        {profile.role === 'school_admin' && <SchoolSettings initialData={roleData} />}
                        {profile.role === 'teacher' && <TeacherSettings initialData={roleData} profileId={profile.id} />}
                        {profile.role === 'student' && <StudentSettings initialData={roleData} profileId={profile.id} />}
                    </TabsContent>

                    <TabsContent value="security" className="mt-0">
                        <SecuritySettings />
                    </TabsContent>

                    {profile.role === 'super_admin' && (
                        <TabsContent value="system" className="mt-0 space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="border-b pb-6">
                                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight">Global System Settings</h2>
                                <p className="text-slate-500 font-medium text-sm mt-1">Configure platform-wide branding and institutional preferences.</p>
                            </div>
                            <SystemSettings settings={siteSettings} />
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div>
    );
}

