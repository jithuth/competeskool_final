"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ID } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, ImageIcon, Sparkles } from "lucide-react";
import { saveSystemSettingsAction, uploadFileAction } from "@/app/actions/admin";
import Image from "next/image";

interface SystemSettingsProps {
    settings: Record<string, string>;
}

export function SystemSettings({ settings }: SystemSettingsProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(settings.site_title || "CompeteEdu");
    const [heroTitle, setHeroTitle] = useState(settings.home_hero_title || "");
    const [heroSubtitle, setHeroSubtitle] = useState(settings.home_hero_subtitle || "");
    const [heroDesc, setHeroDesc] = useState(settings.home_hero_description || "");
    const [contactEmail, setContactEmail] = useState(settings.contact_email || "");
    const [footerCopy, setFooterCopy] = useState(settings.footer_copy || "");
    const [themeColor, setThemeColor] = useState(settings.theme_primary_color || "#4F46E5");
    const [galleryEnabled, setGalleryEnabled] = useState(settings.gallery_enabled !== "false");

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>(settings.site_logo || "");
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let finalLogoUrl = logoPreview;

            if (logoFile) {
                const formData = new FormData();
                formData.append("file", logoFile);
                const uploadRes = await uploadFileAction(formData);
                if (uploadRes.error) throw new Error(uploadRes.error);
                finalLogoUrl = uploadRes.url!;
            }

            const res = await saveSystemSettingsAction({
                site_title: title,
                site_logo: finalLogoUrl,
                home_hero_title: heroTitle,
                home_hero_subtitle: heroSubtitle,
                home_hero_description: heroDesc,
                contact_email: contactEmail,
                footer_copy: footerCopy,
                theme_primary_color: themeColor,
                gallery_enabled: String(galleryEnabled)
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Global settings updated successfully!");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12">
                {/* Section 1: Identity & Logo */}
                <div className="space-y-8">
                    <div className="space-y-6">
                        <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> Platform Branding
                        </Label>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Official Name</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. CompeteEdu India"
                                    className="h-12 rounded-xl border-2 font-bold px-4"
                                />
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Brand Theme Color</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Primary accent color for the platform.</p>
                                    </div>
                                    <input
                                        type="color"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="w-12 h-12 rounded-lg border-2 border-white shadow-sm cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Public Gallery</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Toggle global visibility of the submissions gallery.</p>
                                    </div>
                                    <button
                                        onClick={() => setGalleryEnabled(!galleryEnabled)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${galleryEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${galleryEnabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" /> Visual Assets
                        </Label>
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            {logoPreview ? (
                                <div className="relative group/logo w-24 h-24 shrink-0 rounded-2xl bg-white shadow-xl overflow-hidden border-4 border-white">
                                    <Image src={logoPreview} alt="Logo" fill className="object-contain p-1" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer">
                                            <Upload className="w-5 h-5 text-white" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-24 h-24 shrink-0 rounded-2xl bg-white border-4 border-white shadow-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all">
                                    <Upload className="w-6 h-6 text-slate-300" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            )}
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Platform Logo</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Recommended 512x512px. Used in sidebar and tab icon.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Contact & Footer */}
                <div className="space-y-8">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Global Footer & Support</Label>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Support Email</Label>
                            <Input
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="support@yourdomain.com"
                                className="h-12 rounded-xl border-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Copyright Text</Label>
                            <Input
                                value={footerCopy}
                                onChange={(e) => setFooterCopy(e.target.value)}
                                placeholder="© 2026 Your Organization. All Rights Reserved."
                                className="h-12 rounded-xl border-2"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Home Page Content */}
            <div className="pt-12 border-t border-slate-100 space-y-8">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Landing Page (Hero Section)</Label>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hero Heading</Label>
                            <Input
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                                className="h-12 rounded-xl border-2 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hero Sub-heading</Label>
                            <Input
                                value={heroSubtitle}
                                onChange={(e) => setHeroSubtitle(e.target.value)}
                                className="h-12 rounded-xl border-2"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hero Description</Label>
                        <textarea
                            value={heroDesc}
                            onChange={(e) => setHeroDesc(e.target.value)}
                            rows={4}
                            className="w-full rounded-2xl border-2 p-4 text-sm font-medium focus:ring-primary/20 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-12 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="h-16 px-12 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-black transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Synchronize Platform Configuration
                </Button>
            </div>
        </div>
    );
}
