import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Globe, ArrowRight, Settings, Image as ImageIcon, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CMSPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== 'super_admin') redirect("/dashboard");

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black font-outfit uppercase tracking-tight text-slate-900">
                        Site <span className="text-primary italic">Management</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">
                        Configure institutional branding and content frameworks
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] border-2 hover:border-primary/20 transition-all group overflow-hidden bg-white">
                    <CardHeader className="p-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                            <Settings className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-black font-outfit uppercase">Branding & Identity</CardTitle>
                        <CardDescription className="font-medium text-slate-500">
                            Update platform name, official logo, and global identity settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <Button asChild className="w-full h-12 rounded-xl bg-slate-950 hover:bg-primary font-bold uppercase tracking-widest text-[9px] gap-2">
                            <Link href="/dashboard/settings?tab=system">
                                Configure Identity <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-2 hover:border-emerald-200/50 transition-all group overflow-hidden bg-white">
                    <CardHeader className="p-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                            <Layout className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-black font-outfit uppercase">Home Framework</CardTitle>
                        <CardDescription className="font-medium text-slate-500">
                            Manage hero sections, subtitles, and introductory media content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <Button asChild className="w-full h-12 rounded-xl bg-slate-950 hover:bg-emerald-600 font-bold uppercase tracking-widest text-[9px] gap-2">
                            <Link href="/dashboard/settings?tab=system">
                                Manage Framework <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-2 hover:border-amber-200/50 transition-all group overflow-hidden bg-white">
                    <CardHeader className="p-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                            <Globe className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-black font-outfit uppercase">SEO Control</CardTitle>
                        <CardDescription className="font-medium text-slate-500">
                            Optimize meta tags, descriptions, and keywords for search indexers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <Button asChild className="w-full h-12 rounded-xl bg-slate-950 hover:bg-amber-600 font-bold uppercase tracking-widest text-[9px] gap-2">
                            <Link href="/dashboard/settings?tab=system">
                                Optimize Presence <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="p-12 rounded-[3.5rem] bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent blur-3xl" />
                <div className="relative z-10 space-y-4 max-w-xl">
                    <h2 className="text-3xl font-black font-outfit leading-tight uppercase">System <span className="text-primary italic">Notice</span></h2>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        Institutional branding changes are universal. Updating the site title or logo will affect all user portals and communications across the entire framework.
                    </p>
                </div>
            </div>
        </div>
    );
}
