"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveSiteSettingsAction, saveSeoConfigAction } from "@/app/actions/cms";
import { createClient } from "@/lib/supabase/client";
import {
    Layout,
    Search,
    Upload,
    Save,
    Globe,
    Image as ImageIcon,
    Plus,
    X,
    Loader2
} from "lucide-react";
import Image from "next/image";

interface Setting {
    key: string;
    value: string;
    description: string;
    type: string;
    category: string;
}

interface SeoConfig {
    page_path: string;
    title: string;
    description: string;
    keywords: string;
    og_image_url?: string;
}

export function CMSForm({ initialSettings, initialSeo }: { initialSettings: any[], initialSeo: any[] }) {
    const [settings, setSettings] = useState<Setting[]>(initialSettings);
    const [seo, setSeo] = useState<SeoConfig[]>(initialSeo);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSettingChange = (key: string, value: string) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const handleSeoChange = (path: string, field: keyof SeoConfig, value: string) => {
        setSeo(prev => prev.map(s => s.page_path === path ? { ...s, [field]: value } : s));
    };

    const handleImageUpload = async (key: string, file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${key}-${Date.now()}.${fileExt}`;
            const filePath = `hero/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath);

            handleSettingChange(key, publicUrl);
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        const res = await saveSiteSettingsAction(settings);
        if (res.error) toast.error(res.error);
        else toast.success("Site settings updated!");
        setLoading(false);
    };

    const saveSeo = async () => {
        setLoading(true);
        const res = await saveSeoConfigAction(seo);
        if (res.error) toast.error(res.error);
        else toast.success("SEO configurations updated!");
        setLoading(false);
    };

    return (
        <Tabs defaultValue="home" className="w-full">
            <div className="flex justify-between items-center mb-6">
                <TabsList className="bg-slate-100 p-1 rounded-2xl">
                    <TabsTrigger value="home" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Home Page</TabsTrigger>
                    <TabsTrigger value="seo" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">SEO & Metadata</TabsTrigger>
                    <TabsTrigger value="general" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">General</TabsTrigger>
                </TabsList>
                <div className="flex gap-3">
                    <Button
                        disabled={loading}
                        onClick={() => { saveSettings(); saveSeo(); }}
                        className="rounded-2xl h-12 px-8 bg-slate-950 hover:bg-slate-900 shadow-xl shadow-slate-200"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <TabsContent value="home" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Hero Text */}
                    <Card className="rounded-[2.5rem] border-2 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b p-8">
                            <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight">Hero Section Text</CardTitle>
                            <CardDescription>Main messaging for the landing page</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {[
                                { k: 'home_hero_title', label: 'Main Heading' },
                                { k: 'home_hero_subtitle', label: 'Secondary Heading' },
                                { k: 'home_hero_description', label: 'Hero Description', area: true },
                            ].map((item) => (
                                <div key={item.k} className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</Label>
                                    {item.area ? (
                                        <Textarea
                                            value={settings.find(s => s.key === item.k)?.value || ""}
                                            onChange={(e) => handleSettingChange(item.k, e.target.value)}
                                            className="rounded-xl border-slate-200 min-h-[100px]"
                                        />
                                    ) : (
                                        <Input
                                            value={settings.find(s => s.key === item.k)?.value || ""}
                                            onChange={(e) => handleSettingChange(item.k, e.target.value)}
                                            className="rounded-xl h-12 border-slate-200 font-medium"
                                        />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Hero Visual */}
                    <Card className="rounded-[2.5rem] border-2 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b p-8">
                            <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight">Hero Visual Asset</CardTitle>
                            <CardDescription>Background poster for the hero section</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 text-center">
                            <div className="relative aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group">
                                {settings.find(s => s.key === 'home_hero_image')?.value ? (
                                    <Image
                                        src={settings.find(s => s.key === 'home_hero_image')?.value || ""}
                                        alt="Hero Preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <ImageIcon className="w-12 h-12 mb-2" />
                                        <span className="text-sm font-bold">No Image Selected</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Label htmlFor="hero-image" className="cursor-pointer bg-white text-slate-950 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-transform active:scale-95 flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Change Asset
                                    </Label>
                                    <Input
                                        id="hero-image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload('home_hero_image', file);
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recommended Resolution: 1920x1080 (Aspect 16:9)</p>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
                <Card className="rounded-[2.5rem] border-2 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight">Search Engine Optimization</CardTitle>
                                <CardDescription>Manage how pages appear in search results</CardDescription>
                            </div>
                            <Button variant="outline" className="rounded-xl border-slate-200 text-xs font-black uppercase">
                                <Search className="w-3 h-3 mr-2" /> Global SEO Audit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {seo.map((item) => (
                                <div key={item.page_path} className="p-8 space-y-6 group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase">
                                            {item.page_path === '/' ? 'Home' : item.page_path.replace('/', '')}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight">{item.page_path}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sitemap Node</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Meta Title</Label>
                                                <Input
                                                    value={item.title}
                                                    onChange={(e) => handleSeoChange(item.page_path, 'title', e.target.value)}
                                                    className="rounded-xl h-12 border-slate-200 font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Keywords (Comma Separated)</Label>
                                                <Input
                                                    value={item.keywords}
                                                    onChange={(e) => handleSeoChange(item.page_path, 'keywords', e.target.value)}
                                                    className="rounded-xl h-12 border-slate-200 font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Meta Description</Label>
                                            <Textarea
                                                value={item.description}
                                                onChange={(e) => handleSeoChange(item.page_path, 'description', e.target.value)}
                                                className="rounded-xl min-h-[125px] border-slate-200 font-medium leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
                <Card className="rounded-[2.5rem] border-2 shadow-sm overflow-hidden max-w-2xl">
                    <CardHeader className="bg-slate-50 border-b p-8">
                        <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight">Institutional Contact & Footer</CardTitle>
                        <CardDescription>Global site-wide configurations</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {[
                            { k: 'contact_email', label: 'Support Email Address' },
                            { k: 'footer_copy', label: 'Footer Copyright Notice' },
                        ].map((item) => (
                            <div key={item.k} className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</Label>
                                <Input
                                    value={settings.find(s => s.key === item.k)?.value || ""}
                                    onChange={(e) => handleSettingChange(item.k, e.target.value)}
                                    className="rounded-xl h-12 border-slate-200 font-medium"
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
