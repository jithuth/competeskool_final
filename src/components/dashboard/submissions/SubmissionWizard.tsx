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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Loader2, Upload, Youtube, CheckCircle2, ChevronRight, ChevronLeft,
    Rocket, Info, Video as VideoIcon, ImageIcon, Music, FileText,
    AlertCircle, Sparkles, Cpu, Zap, ScrollText, Eye, Trophy,
    CloudUpload, Wand2, Film,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const STEPS = [
    { id: 1, title: "Competition", icon: Info, description: "Select Arena" },
    { id: 2, title: "Upload", icon: Zap, description: "Project File" },
    { id: 3, title: "Details", icon: ScrollText, description: "Add Info" },
    { id: 4, title: "Review", icon: Eye, description: "Final Check" },
];

// ─── Upload helpers ───────────────────────────────────────────────────────────

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB — safely under Next.js dev-mode body limit


/**
 * Uploads a video to the platform YouTube channel via chunked proxy.
 *
 * Flow:
 *   1. POST /api/youtube-upload-init  → get authenticated resumable uploadUrl
 *   2. Split file into 8 MB chunks
 *   3. POST each chunk to /api/youtube-upload-chunk (proxies to YouTube)
 *   4. YouTube returns video ID after the final chunk
 *
 * Why chunks? Direct browser→YouTube is blocked by CORS.
 * Why 8 MB? Next.js dev proxy buffers bodies and cuts off above ~10 MB.
 */
async function uploadToYouTubeChunked(
    file: File,
    title: string,
    description: string,
    onProgress: (pct: number) => void,
): Promise<{ videoId: string; youtubeUrl: string; embedUrl: string }> {
    // ── Step 1: Initiate YouTube resumable session ──
    const initRes = await fetch("/api/youtube-upload-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title,
            description,
            fileSize: file.size,
            contentType: file.type || "video/mp4",
        }),
    });
    const initData = await initRes.json();
    if (!initRes.ok) throw new Error(initData.error || "Failed to initiate YouTube upload");
    const { uploadUrl } = initData as { uploadUrl: string };

    // ── Step 2: Send chunks ──
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedBytes = 0;

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const byteEnd = end - 1;

        const res = await fetch("/api/youtube-upload-chunk", {
            method: "POST",
            headers: {
                "Content-Type": file.type || "video/mp4",
                "x-upload-url": uploadUrl,
                "x-content-range": `bytes ${start}-${byteEnd}/${file.size}`,
            },
            body: chunk,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Chunk ${i + 1} failed`);

        uploadedBytes = end;
        onProgress(Math.min(99, Math.round((uploadedBytes / file.size) * 100)));

        // When YouTube returns 200/201 the upload is complete
        if (data.done) {
            onProgress(100);
            return {
                videoId: data.videoId,
                youtubeUrl: data.youtubeUrl,
                embedUrl: data.embedUrl,
            };
        }
    }

    throw new Error("Upload completed but no video ID received from YouTube");
}


/**
 * Audio / Image — direct Supabase Storage upload (no compression needed).
 */
async function uploadDirectToSupabase(
    file: File,
    userId: string,
    onProgress: (pct: number) => void
): Promise<{ url: string; path: string }> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Supabase JS client doesn't expose upload progress natively,
    // so we fake a smooth progress bar while uploading.
    let fakeTick = 0;
    const fakeInterval = setInterval(() => {
        fakeTick = Math.min(fakeTick + 8, 85);
        onProgress(fakeTick);
    }, 300);

    try {
        const { error } = await supabase.storage
            .from("submissions")
            .upload(storagePath, file, { upsert: false });

        clearInterval(fakeInterval);

        if (error) throw new Error(error.message);

        onProgress(100);

        const { data: { publicUrl } } = supabase.storage
            .from("submissions")
            .getPublicUrl(storagePath);

        return { url: publicUrl, path: storagePath };
    } catch (err) {
        clearInterval(fakeInterval);
        throw err;
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubmissionWizard({ events, initialEventId }: { events: any[]; initialEventId?: string }) {
    const [currentStep, setCurrentStep] = useState(initialEventId ? 2 : 1);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "compressing" | "done">("idle");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [processedMedia, setProcessedMedia] = useState<{
        url?: string;
        path?: string;
        youtubeUrl?: string;
        youtubeId?: string;
        storageType?: "youtube" | "supabase";
        compressed?: boolean;
        savings?: string;
    } | null>(null);
    const [uploadStats, setUploadStats] = useState<{ originalMb: string; finalMb: string; savings: string } | null>(null);

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
            vimeo_url: "",
        },
    });

    useEffect(() => {
        if (initialEventId) {
            const event = events.find(e => e.id === initialEventId);
            if (event) setSelectedEvent(event);
        }
    }, [initialEventId, events]);

    const getMediaType = () => selectedEvent?.media_type || "video";

    const getMediaIcon = () => {
        const type = getMediaType();
        if (type.includes("image")) return ImageIcon;
        if (type.includes("audio")) return Music;
        if (type.includes("document")) return FileText;
        return VideoIcon;
    };

    const MediaIcon = getMediaIcon();
    const currentValues = form.getValues();

    // ─── File processing ────────────────────────────────────────────────────

    const processFile = async (file: File) => {
        const { getCurrentUserAction } = await import("@/app/actions/session");
        const sessionInfo = await getCurrentUserAction();
        if (!sessionInfo?.userId) {
            toast.error("Session expired. Please log in again.");
            return;
        }

        const isVideo = file.type.startsWith("video/");
        const isAudio = file.type.startsWith("audio/");
        const maxSizeMb = isVideo ? 500 : isAudio ? 100 : 50;

        if (file.size > maxSizeMb * 1024 * 1024) {
            toast.error(`File too large. Maximum: ${maxSizeMb} MB for ${isVideo ? "video" : isAudio ? "audio" : "this file type"}.`);
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            if (isVideo) {
                // Video goes Browser → our 8MB chunk proxy → YouTube (no CORS, no size limit).
                setUploadPhase("uploading");
                const result = await uploadToYouTubeChunked(
                    file,
                    form.getValues("title") || file.name,
                    form.getValues("description") || "",
                    (pct: number) => {
                        if (pct >= 70) setUploadPhase("compressing");
                        setUploadProgress(pct);
                    }
                );

                setProcessedMedia({
                    youtubeUrl: result.youtubeUrl,
                    youtubeId: result.videoId,
                    storageType: "youtube",
                });
                toast.success("✅ Video uploaded successfully!");
            } else {
                // ── Audio / image / document → direct Supabase upload ──
                setUploadPhase("uploading");
                const result = await uploadDirectToSupabase(file, sessionInfo.userId!, setUploadProgress);
                setProcessedMedia({ url: result.url, path: result.path, storageType: "supabase" });
                toast.success("File uploaded successfully!");
            }

            setUploadPhase("done");
        } catch (err: any) {
            toast.error(err.message || "Upload failed. Please try again.");
            setUploadPhase("idle");
            setUploadProgress(0);
            setMediaFile(null);
        } finally {
            setLoading(false);
        }
    };

    // ─── Step navigation ─────────────────────────────────────────────────────

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (currentStep === 1) fieldsToValidate = ["event_id"];
        if (currentStep === 2) {
            if (!mediaFile && !processedMedia && form.getValues("type") === "upload") {
                toast.error("Please upload your project file first.");
                return;
            }
            if (form.getValues("type") === "upload" && !processedMedia) {
                toast.error("File is still processing. Please wait.");
                return;
            }
            if (form.getValues("type") === "youtube" && !form.getValues("youtube_url")) {
                toast.error("Please provide a YouTube URL.");
                return;
            }
            if (form.getValues("type") === "vimeo" && !form.getValues("vimeo_url")) {
                toast.error("Please provide a Vimeo URL.");
                return;
            }
        }
        if (currentStep === 3) fieldsToValidate = ["title", "description"];

        const isValid = await form.trigger(fieldsToValidate as any);
        if (isValid) setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // ─── Final submission ─────────────────────────────────────────────────────

    async function onSubmit(values: SubmissionFormValues) {
        if (values.type === "upload" && !processedMedia) {
            toast.error("Upload not complete yet.");
            return;
        }
        setLoading(true);

        const { getCurrentUserAction } = await import("@/app/actions/session");
        const sessionInfo = await getCurrentUserAction();
        const userId = sessionInfo?.userId;
        const mediaData = processedMedia || { url: "", path: "" };

        // Prevent duplicate submissions
        const { data: existing } = await supabase
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
                status: "pending",
            })
            .select()
            .single();

        if (subError) {
            toast.error(subError.message);
            setLoading(false);
            return;
        }

        const { error: videoError } = await supabase.from("submission_videos").insert({
            submission_id: submission.id,
            // YouTube auto-upload: save as youtube type with youtube_url
            video_url: processedMedia?.storageType === "supabase" ? (processedMedia.url || null) : null,
            youtube_url: processedMedia?.storageType === "youtube" ? (processedMedia.youtubeUrl || null) : null,
            vimeo_url: values.type === "vimeo" ? values.vimeo_url : null,
            storage_path: processedMedia?.path || null,
            type: processedMedia?.storageType === "youtube" ? "youtube"
                : values.type === "vimeo" ? "vimeo"
                    : "upload",
        });

        if (videoError) {
            toast.error(videoError.message);
            setLoading(false);
            return;
        }

        toast.success("Submission launched! 🚀");
        router.push(`/dashboard/my-submissions`);
        router.refresh();
    }

    // ─── Progress indicator ───────────────────────────────────────────────────

    const phaseLabel = {
        idle: "",
        uploading: "Uploading to server…",
        compressing: "Compressing video on server…",
        done: "Upload complete",
    };

    const mediaType = getMediaType();
    const maxFileSizeMb = mediaType === "video" ? 500 : mediaType === "audio" ? 100 : 50;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8">
            {/* Stepper */}
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

                        {/* ── Step 1: Choose Competition ── */}
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
                                                    <SelectTrigger className="h-12 bg-white rounded-lg border-slate-200 font-bold text-sm px-5">
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
                                            <p className="text-[11px] text-indigo-700/80 leading-tight font-bold">
                                                This competition accepts <strong>{selectedEvent.media_type}</strong> files. Max {maxFileSizeMb} MB.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 2: Upload ── */}
                        {currentStep === 2 && (
                            <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                {/* Type tabs — Upload File / Vimeo link */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <Button
                                        type="button"
                                        className={cn(
                                            "h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all",
                                            form.watch("type") === "upload" ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"
                                        )}
                                        onClick={() => form.setValue("type", "upload")}
                                    >
                                        <CloudUpload className="mr-2 h-4 w-4" /> Upload File
                                    </Button>
                                    <Button
                                        type="button"
                                        className={cn(
                                            "h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all",
                                            form.watch("type") === "vimeo" ? "bg-sky-600 border-sky-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"
                                        )}
                                        disabled={selectedEvent?.media_type !== "video" && selectedEvent?.media_type !== "audio_video"}
                                        onClick={() => form.setValue("type", "vimeo")}
                                    >
                                        <Film className="mr-2 h-4 w-4" /> Vimeo Link
                                    </Button>
                                </div>

                                {form.watch("type") === "upload" ? (
                                    <div className="space-y-4">
                                        {/* Drop zone */}
                                        <label className={cn(
                                            "flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-[2rem] cursor-pointer transition-all hover:border-indigo-400 group relative overflow-hidden bg-white",
                                            uploadPhase === "done" ? "border-emerald-400 bg-emerald-50/10" :
                                                loading ? "border-indigo-300 bg-indigo-50/10 cursor-wait" :
                                                    mediaFile ? "border-indigo-400" : "border-slate-200"
                                        )}>
                                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                                {uploadPhase === "done" ? (
                                                    <>
                                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-3">
                                                            <CheckCircle2 className="w-7 h-7 text-white" />
                                                        </div>
                                                        <p className="text-[11px] text-emerald-700 font-black uppercase tracking-widest">{mediaFile?.name}</p>
                                                        <p className="text-[9px] text-emerald-500 font-bold mt-1 uppercase">✓ Ready to Submit</p>
                                                        {uploadStats && (
                                                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                                {uploadStats.originalMb} MB → {uploadStats.finalMb} MB · Saved {uploadStats.savings}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : loading ? (
                                                    <>
                                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3 animate-pulse">
                                                            <CloudUpload className="w-7 h-7 text-indigo-500" />
                                                        </div>
                                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                                                            {uploadPhase === "compressing"
                                                                ? "Processing…"
                                                                : phaseLabel[uploadPhase]}
                                                        </p>
                                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{mediaFile?.name}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 text-slate-300">
                                                            <MediaIcon className="w-7 h-7" />
                                                        </div>
                                                        <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">
                                                            {mediaFile ? mediaFile.name : "Click or drag to upload"}
                                                        </p>
                                                        <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                                                            {mediaType} · max {maxFileSizeMb} MB
                                                        </p>
                                                        {mediaType === "video" && (
                                                            <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                                                                <CloudUpload className="w-3 h-3 text-indigo-500" />
                                                                <p className="text-[8px] font-black uppercase tracking-widest text-indigo-600">
                                                                    Securely processed &amp; stored
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <input
                                                type="file"
                                                className="hidden"
                                                disabled={loading}
                                                accept={
                                                    mediaType === "video" ? "video/*" :
                                                        mediaType === "image" ? "image/*" :
                                                            mediaType === "audio" ? "audio/*" : "*"
                                                }
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setMediaFile(file);
                                                    setProcessedMedia(null);
                                                    setUploadStats(null);
                                                    processFile(file);
                                                }}
                                            />
                                        </label>

                                        {/* Progress bar */}
                                        {loading && (
                                            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-0.5">
                                                            {uploadPhase === "compressing" ? "🔧 Compressing on Server" : "☁ Uploading File"}
                                                        </p>
                                                        <h4 className="text-xs font-black uppercase text-slate-800">
                                                            {phaseLabel[uploadPhase]}
                                                        </h4>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-900 italic">{uploadProgress}%</span>
                                                </div>
                                                <Progress value={uploadProgress} className="h-2 rounded-full" />
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center animate-pulse">
                                                    {uploadPhase === "compressing"
                                                        ? "Processing your file…"
                                                        : "Transferring file to server…"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : form.watch("type") === "youtube" ? (
                                    /* YouTube URL */
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
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                                                    Paste any youtube.com or youtu.be link
                                                </p>
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    /* Vimeo URL */
                                    <FormField
                                        control={form.control}
                                        name="vimeo_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Vimeo URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://vimeo.com/123456789" className="h-12 bg-white rounded-lg border-slate-200 font-bold px-5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                                                    Paste your vimeo.com video link
                                                </p>
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {/* ── Step 3: Details ── */}
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
                                                <Textarea placeholder="Explain your innovation…" className="min-h-[120px] bg-white rounded-xl border-slate-200 font-medium px-5 py-4" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* ── Step 4: Review ── */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl">
                                    <div className="grid md:grid-cols-5 min-h-[260px]">
                                        <div className="md:col-span-2 relative bg-slate-900 flex items-center justify-center p-8">
                                            {currentValues.type === "youtube" ? (
                                                <div className="text-center space-y-4">
                                                    <Youtube className="w-16 h-16 text-red-600 mx-auto" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">YouTube Link</p>
                                                </div>
                                            ) : currentValues.type === "vimeo" ? (
                                                <div className="text-center space-y-4">
                                                    <Film className="w-16 h-16 text-sky-400 mx-auto" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Vimeo Link</p>
                                                </div>
                                            ) : mediaFile ? (
                                                <div className="text-center space-y-4">
                                                    <MediaIcon className="w-16 h-16 text-primary mx-auto" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Uploaded File</p>
                                                    {uploadStats && (
                                                        <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                                                Compressed · Saved {uploadStats.savings}
                                                            </p>
                                                        </div>
                                                    )}
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
                                                <p className="text-slate-500 font-medium text-xs line-clamp-3 leading-relaxed">{currentValues.description || "No description provided."}</p>
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
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-4 items-center">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] text-emerald-900 font-black uppercase tracking-widest">Ready to Submit</p>
                                        <p className="text-[11px] text-emerald-700 font-medium">Everything looks good! Click Submit to launch your entry.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100/50">
                        {currentStep > 1 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all hover:bg-slate-50 text-slate-400 hover:text-slate-900"
                            >
                                <ChevronLeft className="mr-2 w-3 h-3" /> Go Back
                            </Button>
                        ) : <div />}

                        {currentStep < STEPS.length ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={loading}
                                className="h-12 px-10 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white font-black uppercase tracking-[0.2em] text-[9px] shadow-lg shadow-indigo-100 group active:scale-[0.98] transition-all"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Next Step <ChevronRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" /></>}
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
