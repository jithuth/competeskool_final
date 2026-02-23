import { createClient } from "@/lib/supabase/server";
import { CMSForm } from "@/components/dashboard/cms/CMSForm";
import { redirect } from "next/navigation";
import {
    Globe,
    Settings2,
    Monitor,
    Search,
    Layout,
    Share2
} from "lucide-react";

export default async function CMSPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is super_admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

    if (profile?.role !== 'super_admin') {
        redirect("/dashboard");
    }

    // Fetch existing settings and SEO configs
    const { data: settings } = await supabase
        .from("site_settings")
        .select("*")
        .order("category");

    const { data: seoConfigs } = await supabase
        .from("seo_configs")
        .select("*")
        .order("page_path");

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground border border-primary/30 text-xs font-bold uppercase tracking-widest">
                            <Settings2 className="w-4 h-4" />
                            <span>System Control</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black font-outfit leading-tight">
                            Frontend <span className="text-primary italic">Management</span>
                        </h1>
                        <p className="text-slate-400 max-w-xl text-lg font-light leading-relaxed">
                            Control the global narrative, visual assets, and SEO performance of the CompeteEdu India platform.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center space-y-2 backdrop-blur-md">
                            <Monitor className="w-8 h-8 text-primary mx-auto" />
                            <div className="text-2xl font-black font-outfit">Active</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">CMS Engine</div>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center space-y-2 backdrop-blur-md">
                            <Share2 className="w-8 h-8 text-emerald-500 mx-auto" />
                            <div className="text-2xl font-black font-outfit">Sitemap</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Indexing</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CMS Interface */}
            <CMSForm initialSettings={settings || []} initialSeo={seoConfigs || []} />
        </div>
    );
}
