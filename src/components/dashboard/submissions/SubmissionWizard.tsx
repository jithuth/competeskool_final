"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { submissionSchema, SubmissionFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Loader2,
    Upload,
    Youtube,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Rocket,
    Info,
    Video as VideoIcon,
    ImageIcon,
    Music,
    FileText,
    AlertCircle,
    Trash2,
    Sparkles,
    ShieldCheck,
    Cpu,
    Zap,
    ScrollText,
    Eye,
    Trophy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const STEPS = [
    { id: 1, title: "Competition", icon: Info, description: "Select Arena" },
    { id: 2, title: "Upload", icon: Zap, description: "Project File" },
    { id: 3, title: "Details", icon: ScrollText, description: "Add Info" },
    { id: 4, title: "Review", icon: Eye, description: "Final Check" },
];

export function SubmissionWizard({ events, initialEventId }: { events: any[], initialEventId?: string }) {
    const [currentStep, setCurrentStep] = useState(initialEventId ? 2 : 1);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [compressing, setCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [processedMedia, setProcessedMedia] = useState<{ url: string; path: string } | null>(null);
    const ffmpegRef = useRef(new FFmpeg());

    const loadFFmpeg = async () => {
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) return;

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
            setCompressionProgress(Math.round(progress * 100));
        });

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
    };

    const compressVideo = async (file: File): Promise<File> => {
        setCompressing(true);
        try {
            const ffmpeg = ffmpegRef.current;
            await loadFFmpeg();
            const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
            const outputName = 'output.mp4';
            await ffmpeg.writeFile(inputName, await fetchFile(file));
            await ffmpeg.exec([
                '-i', inputName,
                '-vcodec', 'libx264',
                '-crf', '28',
                '-preset', 'ultrafast',
                '-vf', "scale='min(1280,iw)':-2",
                '-maxrate', '1.5M',
                '-bufsize', '3M',
                outputName
            ]);
            const data = await ffmpeg.readFile(outputName);
            const compressedBlob = new Blob([data as any], { type: 'video/mp4' });
            return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.mp4", { type: 'video/mp4' });
        } catch (error) {
            console.error("Compression failed:", error);
            return file;
        } finally {
            setCompressing(false);
        }
    };

    const router = useRouter();
    const supabase = createClient();

    const form = useForm<SubmissionFormValues>({
        resolver: zodResolver(submissionSchema),
        defaultValues: {
            title: "",
            description: "",
            event_id: initialEventId || "",
            type: "upload",
            video_url: "",
            youtube_url: "",
        },
    });

    useEffect(() => {
        if (initialEventId) {
            const event = events.find(e => e.id === initialEventId);
            if (event) setSelectedEvent(event);
        }
    }, [initialEventId, events]);

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (currentStep === 1) fieldsToValidate = ["event_id"];
        if (currentStep === 2) {
            if (!mediaFile && form.getValues("type") === "upload") {
                toast.error("Please sync your project payload.");
                return;
            }
            if (form.getValues("type") === "youtube" && !form.getValues("youtube_url")) {
                toast.error("Please provide a YouTube URL.");
                return;
            }
        }
        if (currentStep === 3) fieldsToValidate = ["title", "description"];

        const isValid = await form.trigger(fieldsToValidate as any);
        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    async function handleFileUpload(file: File) {
        if (file.size > 50 * 1024 * 1024) {
            toast.error("Payload too heavy. Limit: 50MB.");
            return null;
        }
        const { getCurrentUserAction } = await import('@/app/actions/session');
        const sessionInfo = await getCurrentUserAction();
        const userId = sessionInfo?.userId;
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from("submissions")
            .upload(filePath, file, {
                onUploadProgress: (progress: any) => {
                    const percentage = Math.round((progress.loaded / progress.total) * 100);
                    setUploadProgress(percentage);
                },
            } as any);
        if (uploadError) {
            toast.error(uploadError.message);
            return null;
        }
        const { data: { publicUrl } } = supabase.storage
            .from("submissions")
            .getPublicUrl(filePath);
        return { url: publicUrl, path: filePath };
    }

    const startBackgroundProcess = async (file: File) => {
        setLoading(true);
        try {
            let fileToUpload = file;
            if (file.type.startsWith('video/')) {
                fileToUpload = await compressVideo(file);
            }
            setUploadProgress(1);
            const uploaded = await handleFileUpload(fileToUpload);
            if (uploaded) {
                setProcessedMedia(uploaded);
                toast.success("Payload optimized!");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    async function onSubmit(values: SubmissionFormValues) {
        if (values.type === "upload" && !processedMedia) {
            toast.error("Finalizing uplink...");
            return;
        }
        setLoading(true);
        const { getCurrentUserAction } = await import('@/app/actions/session');
        const sessionInfo = await getCurrentUserAction();
        const userId = sessionInfo?.userId;
        const mediaData = processedMedia || { url: "", path: "" };

        // Check for existing submission
        const { data: existing, error: checkError } = await supabase
            .from("submissions")
            .select("id")
            .eq("event_id", values.event_id)
            .eq("student_id", userId)
            .maybeSingle();

        if (existing) {
            toast.error("You have already submitted to this competition.");
            setLoading(false);
            return;
        }

        const { data: submission, error: subError } = await supabase
            .from("submissions")
            .insert({
                title: values.title,
                description: values.description,
                event_id: values.event_id,
                student_id: userId,
                status: 'pending',
            })
            .select()
            .single();
        if (subError) {
            toast.error(subError.message);
            setLoading(false);
            return;
        }
        const { error: videoError } = await supabase
            .from("submission_videos")
            .insert({
                submission_id: submission.id,
                video_url: values.type === 'youtube' ? null : mediaData.url,
                youtube_url: values.type === 'youtube' ? values.youtube_url : null,
                storage_path: values.type === 'youtube' ? null : mediaData.path,
                type: values.type,
            });
        if (videoError) {
            toast.error(videoError.message);
            setLoading(false);
            return;
        }
        toast.success("Mission Success! Entry Launched.");
        router.push(`/dashboard/submissions/${submission.id}`);
        router.refresh();
    }

    const getMediaIcon = () => {
        const type = selectedEvent?.media_type || 'video';
        if (type.includes('image')) return ImageIcon;
        if (type.includes('audio')) return Music;
        if (type.includes('document')) return FileText;
        return VideoIcon;
    };

    const MediaIcon = getMediaIcon();
    const currentValues = form.getValues();

    return (
        <div className="space-y-8">
            {/* Event-Style Stepper */}
            <div className="flex items-center justify-between relative px-20">
                <div className="absolute top-5 left-40 right-40 h-0.5 bg-slate-100 -z-10" />
                {STEPS.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-2 group min-w-[80px]">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 text-[10px] font-bold shadow-sm",
                            currentStep > s.id ? "bg-gradient-to-br from-emerald-400 to-teal-600 border-white text-white" :
                                currentStep === s.id ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-white text-white scale-110 ring-2 ring-purple-100" :
                                    "bg-white border-slate-100 text-slate-400"
                        )}>
                            {currentStep > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                        </div>
                        <div className="text-center">
                            <p className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-all",
                                currentStep >= s.id ? "text-slate-900" : "text-slate-300"
                            )}>{s.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentStep === 1 && (
                            <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                <FormField
                                    control={form.control}
                                    name="event_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Active Competition</FormLabel>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    const event = events.find(e => e.id === val);
                                                    setSelectedEvent(event);
                                                }}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-12 bg-white rounded-lg border-slate-200 font-bold text-sm px-5 ring-offset-background">
                                                        <SelectValue placeholder="Choose your competition" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-2">
                                                    {events.map((event) => (
                                                        <SelectItem key={event.id} value={event.id} className="py-2 font-bold text-slate-700">
                                                            {event.title} {event.is_private ? "🔒" : ""}
                                                        </SelectItem>
                                                    ))}
                                                    {events.length === 0 && <SelectItem value="none" disabled>No active arenas</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="font-bold text-xs" />
                                        </FormItem>
                                    )}
                                />
                                {selectedEvent && (
                                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex gap-4 items-center animate-in zoom-in-95">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow shrink-0">
                                            <MediaIcon className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] text-indigo-900 font-black uppercase tracking-widest">Entry Rule</p>
                                            <p className="text-[11px] text-indigo-700/80 leading-tight font-bold">This competition accepts {selectedEvent.media_type} files only.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Button
                                        type="button"
                                        variant={form.watch("type") === "upload" ? "default" : "outline"}
                                        className={cn(
                                            "h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all",
                                            form.watch("type") === "upload" ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"
                                        )}
                                        onClick={() => form.setValue("type", "upload")}
                                    >
                                        <Upload className="mr-2 h-4 w-4" /> File Upload
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={form.watch("type") === "youtube" ? "default" : "outline"}
                                        className={cn(
                                            "h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all",
                                            form.watch("type") === "youtube" ? "bg-red-600 border-red-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"
                                        )}
                                        disabled={selectedEvent?.media_type !== 'video' && selectedEvent?.media_type !== 'audio_video'}
                                        onClick={() => form.setValue("type", "youtube")}
                                    >
                                        <Youtube className="mr-2 h-4 w-4" /> YouTube Link
                                    </Button>
                                </div>

                                {form.watch("type") === "upload" ? (
                                    <div className="space-y-4">
                                        <label className={cn(
                                            "flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-[2rem] cursor-pointer transition-all hover:border-indigo-400 group relative overflow-hidden bg-white",
                                            mediaFile ? "border-emerald-400 bg-emerald-50/10" : "border-slate-200"
                                        )}>
                                            <div className="flex flex-col items-center justify-center p-6">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                                                    mediaFile ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white"
                                                )}>
                                                    <MediaIcon className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest text-center">
                                                    {mediaFile ? mediaFile.name : "Choose File"}
                                                </p>
                                                {mediaFile && (
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">{(mediaFile.size / (1024 * 1024)).toFixed(2)} MB • READY</p>
                                                )}
                                            </div>
                                            <input id="media-upload" type="file" className="hidden" accept={selectedEvent?.media_type === 'video' ? 'video/*' : selectedEvent?.media_type === 'image' ? 'image/*' : '*'} onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setMediaFile(file);
                                                    startBackgroundProcess(file);
                                                }
                                            }} />
                                        </label>

                                        {(loading || compressing || uploadProgress > 0) && (
                                            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-0.5">
                                                            Upload Status
                                                        </p>
                                                        <h4 className="text-xs font-black uppercase text-slate-800">
                                                            {compressing ? "Optimizing video..." : "Uploading file..."}
                                                        </h4>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-900 italic">{compressing ? compressionProgress : uploadProgress}%</span>
                                                </div>
                                                <Progress value={compressing ? compressionProgress : uploadProgress} className="h-2 rounded-full" />
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center animate-pulse">
                                                    Please wait while we process your file
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="youtube_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">YouTube URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://youtube.com/watch?v=..." className="h-12 bg-white rounded-lg border-slate-200 font-bold px-5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Project Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter a catchy title" className="h-12 bg-white rounded-lg border-slate-200 font-bold px-5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Project Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Explain your innovation..." className="min-h-[120px] bg-white rounded-xl border-slate-200 font-medium px-5 py-4" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl">
                                    <div className="grid md:grid-cols-5 min-h-[300px]">
                                        <div className="md:col-span-2 relative bg-slate-900 flex items-center justify-center p-8">
                                            {currentValues.type === 'youtube' ? (
                                                <div className="text-center space-y-4">
                                                    <Youtube className="w-16 h-16 text-red-600 mx-auto" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">YouTube Stream</p>
                                                </div>
                                            ) : mediaFile ? (
                                                <div className="text-center space-y-4">
                                                    <MediaIcon className="w-16 h-16 text-primary mx-auto" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Uploaded File</p>
                                                </div>
                                            ) : (
                                                <AlertCircle className="w-12 h-12 text-slate-700" />
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-white/20 text-white border-none text-[8px] font-black uppercase px-2 py-0">
                                                    {selectedEvent?.title}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-6">
                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tight leading-none">{currentValues.title || "Untitled Entry"}</h2>
                                                <p className="text-slate-500 font-medium text-xs line-clamp-3 leading-relaxed">
                                                    {currentValues.description || "No debrief provided."}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                                    <Trophy className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Competition</p>
                                                    <p className="text-[11px] font-bold text-slate-700">{selectedEvent?.title}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-4 items-center animate-pulse">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] text-emerald-900 font-black uppercase tracking-widest">Ready to Submit</p>
                                        <p className="text-[11px] text-emerald-700 font-medium">Everything looks good! You can now submit your work.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100/50">
                        {currentStep > 1 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all hover:bg-slate-50 text-slate-400 hover:text-slate-900 active:scale-95"
                            >
                                <ChevronLeft className="mr-2 w-3 h-3" /> Go Back
                            </Button>
                        ) : <div />}

                        {currentStep < STEPS.length ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="h-12 px-10 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white font-black uppercase tracking-[0.2em] text-[9px] shadow-lg shadow-indigo-100 group active:scale-[0.98] transition-all"
                            >
                                Next Step <ChevronRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-12 px-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white font-black uppercase tracking-[0.2em] text-[9px] shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <>Submit Project <Rocket className="ml-2 w-3 h-3" /></>}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
