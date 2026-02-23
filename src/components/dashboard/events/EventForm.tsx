"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { eventSchema, EventFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { saveEventAction } from "@/app/actions/admin";
import RichTextEditor from "@/components/ui/RichTextEditor";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    ChevronRight,
    ChevronLeft,
    ClipboardCheck,
    Calendar,
    ScrollText,
    CheckCircle2,
    Image as ImageIcon,
    Upload,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const STEPS = [
    { id: 1, title: "Basics", icon: ClipboardCheck, description: "Title & Type" },
    { id: 2, title: "Schedule", icon: Calendar, description: "Key Dates" },
    { id: 3, title: "Guidelines", icon: ScrollText, description: "Rules & Media" },
    { id: 4, title: "Summary", icon: Eye, description: "Final Review" },
];

const MEDIA_TYPES = [
    { value: "video", label: "Video", color: "bg-blue-500" },
    { value: "audio", label: "Audio", color: "bg-purple-500" },
    { value: "image", label: "Image", color: "bg-emerald-500" },
    { value: "document", label: "Document", color: "bg-orange-500" },
    { value: "audio_video", label: "Audio + Video", color: "bg-indigo-500" },
    { value: "audio_image", label: "Audio + Image", color: "bg-pink-500" },
];

export function EventForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string>(initialData?.banner_url || "");
    const [schools, setSchools] = useState<any[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchSchools() {
            const { data } = await supabase.from("schools").select("id, name").eq("status", "approved");
            if (data) setSchools(data);
        }
        fetchSchools();
    }, [supabase]);

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const formatForInput = (date: Date) => {
        return date.toISOString().slice(0, 16);
    };

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            media_type: initialData?.media_type || "video",
            start_date: initialData?.start_date
                ? formatForInput(new Date(initialData.start_date))
                : formatForInput(now),
            end_date: initialData?.end_date
                ? formatForInput(new Date(initialData.end_date))
                : formatForInput(thirtyDaysLater),
            banner_url: initialData?.banner_url || "",
            full_rules: initialData?.full_rules || "",
            is_private: Boolean(initialData?.is_private || false),
            school_id: initialData?.school_id || "",
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const nextStep = async () => {
        const fields = step === 1 ? ["title", "description", "media_type"]
            : step === 2 ? ["start_date", "end_date"]
                : ["full_rules"];

        const isValid = await form.trigger(fields as any);
        if (isValid) setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    async function onSubmit(values: EventFormValues) {
        setLoading(true);
        try {
            const { getCurrentUserAction } = await import('@/app/actions/session');
            let user = null;
            const sessionInfo = await getCurrentUserAction();
            if (sessionInfo) { user = { id: sessionInfo.userId }; }
            let finalBannerUrl = values.banner_url || "";

            // 1. Upload Banner if exists
            if (bannerFile) {
                const fileExt = bannerFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `banners/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('event-banners')
                    .upload(filePath, bannerFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('event-banners')
                    .getPublicUrl(filePath);

                finalBannerUrl = publicUrl;
            }

            const dataToSave = {
                ...values,
                id: initialData?.id,
                banner_url: finalBannerUrl,
                created_by: user?.id,
                status: initialData?.id ? initialData.status : 'active',
                school_id: values.is_private ? (values.school_id || null) : null
            };

            const result = await saveEventAction(dataToSave);
            if (result.error) throw new Error(result.error);

            toast.success(initialData?.id ? "Competition updated successfully!" : "New competition launched!");
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    const formatDateIST = (dateString: string) => {
        if (!dateString) return "Not set";
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(new Date(dateString)) + " (IST)";
    };

    const currentValues = form.getValues();
    const mediaTypeLabel = MEDIA_TYPES.find(m => m.value === currentValues.media_type)?.label;

    return (
        <div className="space-y-8">
            {/* Wizard Progress */}
            <div className="flex items-center justify-between relative px-20">
                <div className="absolute top-5 left-40 right-40 h-0.5 bg-slate-100 -z-10" />
                {STEPS.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-2 group min-w-[80px]">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 text-[10px] font-bold shadow-sm",
                            step > s.id ? "bg-gradient-to-br from-emerald-400 to-teal-600 border-white text-white" :
                                step === s.id ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-white text-white scale-110 ring-2 ring-purple-100" :
                                    "bg-white border-slate-100 text-slate-400"
                        )}>
                            {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                        </div>
                        <div className="text-center">
                            <p className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-all",
                                step >= s.id ? "text-slate-900" : "text-slate-300"
                            )}>{s.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {step === 1 && (
                            <div className="space-y-4 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Competition Identity</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. National Creative Arts 2026" className="h-12 bg-white rounded-lg border-slate-200 font-bold text-base px-5" {...field} />
                                                </FormControl>
                                                <FormMessage className="font-bold text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="media_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Submission Framework</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 bg-white rounded-lg border-slate-200 text-sm font-bold px-5">
                                                            <SelectValue placeholder="Select media category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-lg">
                                                        {MEDIA_TYPES.map((type) => (
                                                            <SelectItem key={type.value} value={type.value} className="py-2 text-sm">
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="font-bold text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="is_private"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Visibility</FormLabel>
                                                <Select onValueChange={(v) => field.onChange(v === "true")} value={field.value ? "true" : "false"}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 bg-white rounded-lg border-slate-200 text-sm font-bold px-5">
                                                            <SelectValue placeholder="Select Visibility" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="false" className="py-2 text-sm">Public Event</SelectItem>
                                                        <SelectItem value="true" className="py-2 text-sm">Private (Dedicated School)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="font-bold text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch("is_private") && (
                                        <FormField
                                            control={form.control}
                                            name="school_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Dedicated School</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 bg-white rounded-lg border-slate-200 text-sm font-bold px-5">
                                                                <SelectValue placeholder="Select school" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-lg">
                                                            {schools.map(s => (
                                                                <SelectItem key={s.id} value={s.id} className="py-2 text-sm">
                                                                    {s.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="font-bold text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Brief Overview</FormLabel>
                                            <FormControl>
                                                <RichTextEditor
                                                    placeholder="Engaging summary for the dashboard..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="font-bold text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="start_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Phase Commencement</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" className="h-12 bg-white rounded-lg border-slate-200 font-bold text-sm px-5" {...field} />
                                                </FormControl>
                                                <FormMessage className="font-bold text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Final Submission Deadline</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" className="h-12 bg-white rounded-lg border-slate-200 font-bold text-sm px-5 border-red-50 text-red-600 shadow-sm" {...field} />
                                                </FormControl>
                                                <FormMessage className="font-bold text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] text-indigo-900 font-black uppercase tracking-tighter">Automatic Lifecycle Scheduling (IST)</p>
                                        <p className="text-[11px] text-indigo-700/80 leading-tight font-bold">Registration and submission portals will activate and expire automatically at these precise times.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="grid md:grid-cols-2 gap-8 items-start">
                                    <div className="space-y-3">
                                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 block">Promotional Assets</FormLabel>
                                        <div className="flex flex-col items-center justify-center w-full">
                                            {bannerPreview ? (
                                                <div className="relative w-full aspect-video rounded-xl overflow-hidden group border-2 border-white shadow-lg">
                                                    <Image src={bannerPreview} alt="Banner Preview" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                        <label className="cursor-pointer bg-white text-slate-900 px-6 py-3 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-xl transition-transform hover:scale-105">
                                                            Modify Graphics
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-white hover:bg-slate-50 transition-all hover:border-indigo-400 group">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-400 mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                            <Upload className="w-5 h-5" />
                                                        </div>
                                                        <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">Upload Graphics</p>
                                                    </div>
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="full_rules"
                                        render={({ field }) => (
                                            <FormItem className="h-full flex flex-col">
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 block">Comprehensive Guidelines</FormLabel>
                                                <FormControl className="flex-1">
                                                    <RichTextEditor
                                                        placeholder="Establish clear rules, eligibility criteria, and scoring rubrics..."
                                                        className="min-h-[280px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="font-bold text-xs mt-1" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/50">
                                    <div className="grid md:grid-cols-5 h-full">
                                        <div className="md:col-span-2 relative bg-slate-100 min-h-[400px]">
                                            {bannerPreview ? (
                                                <Image src={bannerPreview} alt="Final Preview" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                    <ImageIcon className="w-16 h-16 opacity-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No Banner Provided</span>
                                                </div>
                                            )}
                                            <div className="absolute top-6 left-6">
                                                <div className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur shadow-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100 leading-none">
                                                    {mediaTypeLabel}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-3 p-12 flex flex-col justify-center space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-3xl font-black text-slate-900 font-outfit leading-tight tracking-tight uppercase">{currentValues.title}</h2>
                                                <div
                                                    className="text-slate-500 font-medium text-[13px] leading-relaxed line-clamp-3 html-output"
                                                    dangerouslySetInnerHTML={{ __html: currentValues.description || "" }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Begins</p>
                                                    <p className="text-xs font-black text-indigo-900">
                                                        {formatDateIST(currentValues.start_date)}
                                                    </p>
                                                </div>
                                                <div className="p-6 rounded-[2rem] bg-rose-50/50 border border-rose-100 space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Deadline</p>
                                                    <p className="text-xs font-black text-rose-900">
                                                        {formatDateIST(currentValues.end_date)}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                                <ScrollText className="w-4 h-4 text-slate-400" />
                                                Guidelines Preview
                                            </p>
                                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                                <div
                                                    className="text-[11px] text-slate-600 font-medium leading-relaxed html-output prose prose-indigo prose-xs"
                                                    dangerouslySetInnerHTML={{ __html: currentValues.full_rules || "" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-4 items-center animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-emerald-900 font-black uppercase tracking-widest">Configuration Certified</p>
                                        <p className="text-xs text-emerald-700 font-medium">All parameters validated against institutional guidelines.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <style jsx global>{`
                        .html-output p { margin-bottom: 0.5rem; }
                        .html-output ul { list-style-type: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
                        .html-output ol { list-style-type: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
                        .html-output strong { font-weight: 700; color: #0f172a; }
                        .html-output em { font-style: italic; }
                        .html-output h1 { font-size: 1.25rem; font-weight: 900; margin: 1rem 0 0.5rem 0; }
                        .html-output h2 { font-size: 1.1rem; font-weight: 800; margin: 0.75rem 0 0.4rem 0; }
                    `}</style>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100/50">
                        {step > 1 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all hover:bg-slate-50 text-slate-400 hover:text-slate-900 active:scale-95"
                            >
                                <ChevronLeft className="mr-2 w-3 h-3" /> Go Back
                            </Button>
                        ) : <div />}

                        {step < 4 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="h-12 px-10 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white font-black uppercase tracking-[0.2em] text-[9px] shadow-lg shadow-indigo-100 group active:scale-[0.98] transition-all"
                            >
                                Next Phase <ChevronRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-12 px-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white font-black uppercase tracking-[0.2em] text-[9px] shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <>Launch <CheckCircle2 className="ml-2 w-3 h-3" /></>}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
