"use client";

import { useState } from "react";
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
import { Loader2, Upload, Youtube, CheckCircle2, ChevronRight, ChevronLeft, Rocket, Info, Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const steps = [
    { id: 1, title: "Context", icon: Info, description: "Competition details" },
    { id: 2, title: "Content", icon: Rocket, description: "Project information" },
    { id: 3, title: "Media", icon: VideoIcon, description: "Video submission" },
];

export function SubmissionWizard({ events }: { events: any[] }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const form = useForm<SubmissionFormValues>({
        resolver: zodResolver(submissionSchema),
        defaultValues: {
            title: "",
            description: "",
            event_id: "",
            type: "upload",
            video_url: "",
            youtube_url: "",
        },
    });

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (currentStep === 1) fieldsToValidate = ["event_id"];
        if (currentStep === 2) fieldsToValidate = ["title", "description"];

        const isValid = await form.trigger(fieldsToValidate as any);
        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    async function handleFileUpload(file: File) {
        const { getCurrentUserAction } = await import('@/app/actions/session');
        let user = null;
        const sessionInfo = await getCurrentUserAction();
        if (sessionInfo) { user = { id: sessionInfo.userId }; }
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

        // Note: Standard Supabase SDK upload. progress tracking might need additional setup depending on storage version
        const { error: uploadError } = await supabase.storage
            .from("videos")
            .upload(filePath, file);

        if (uploadError) {
            toast.error(uploadError.message);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from("videos")
            .getPublicUrl(filePath);

        return { url: publicUrl, path: filePath };
    }

    async function onSubmit(values: SubmissionFormValues) {
        if (values.type === "upload" && !videoFile) {
            toast.error("Please upload a video file.");
            return;
        }
        if (values.type === "youtube" && !values.youtube_url) {
            toast.error("Please provide a YouTube URL.");
            return;
        }

        setLoading(true);
        const { getCurrentUserAction } = await import('@/app/actions/session');
        let user = null;
        const sessionInfo = await getCurrentUserAction();
        if (sessionInfo) { user = { id: sessionInfo.userId }; }

        let videoData = { url: "", path: "" };

        if (values.type === "upload" && videoFile) {
            // Manual progress simulation since standard fetch upload doesn't always expose progress
            setUploadProgress(45);
            const uploaded = await handleFileUpload(videoFile);
            if (!uploaded) {
                setLoading(false);
                setUploadProgress(0);
                return;
            }
            setUploadProgress(100);
            videoData = uploaded;
        }

        const { data: submission, error: subError } = await supabase
            .from("submissions")
            .insert({
                title: values.title,
                description: values.description,
                event_id: values.event_id,
                student_id: user?.id,
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
                video_url: values.type === 'youtube' ? null : videoData.url,
                youtube_url: values.type === 'youtube' ? values.youtube_url : null,
                storage_path: values.type === 'youtube' ? null : videoData.path,
                type: values.type,
            });

        if (videoError) {
            toast.error(videoError.message);
            setLoading(false);
            return;
        }

        toast.success("Submission successfully uploaded!");
        router.push("/dashboard/my-submissions");
        router.refresh();
    }

    return (
        <div className="space-y-8">
            {/* Stepper Header */}
            <div className="relative flex justify-between items-start max-w-md mx-auto mb-12 px-4">
                <div className="absolute top-5 left-8 right-8 h-0.5 bg-muted -z-10" />
                <div
                    className="absolute top-5 left-8 h-0.5 bg-primary transition-all duration-500 -z-10"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 80}%` }}
                />

                {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep >= step.id;
                    const isCurrent = currentStep === step.id;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    isActive ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-background border-muted text-muted-foreground",
                                    isCurrent && "ring-4 ring-primary/10"
                                )}
                            >
                                {isActive && currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <div className="text-center">
                                <p className={cn("text-[10px] font-bold uppercase tracking-widest", isActive ? "text-primary" : "text-muted-foreground")}>
                                    {step.title}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 min-h-[300px]">

                    {/* Step 1: Context */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold font-outfit">The Competition</h3>
                                <p className="text-sm text-muted-foreground">Select the event you wish to participate in.</p>
                            </div>
                            <FormField
                                control={form.control}
                                name="event_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Active Competitions</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue placeholder="Choose an active event" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {events.map((event) => (
                                                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                                                ))}
                                                {events.length === 0 && <SelectItem value="none" disabled>No active events</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    {/* Step 2: Content */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold font-outfit">Project Details</h3>
                                <p className="text-sm text-muted-foreground">Tell us about your amazing project.</p>
                            </div>
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Catchy Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your project name" className="h-12 rounded-xl" {...field} />
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
                                        <FormLabel>Project Story</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Explain what you built and why..." className="min-h-[120px] rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    {/* Step 3: Media */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold font-outfit">Showcase Your Work</h3>
                                <p className="text-sm text-muted-foreground">Upload your video or provide a YouTube link.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant={form.watch("type") === "upload" ? "default" : "outline"}
                                    className="h-12 rounded-xl border-2"
                                    onClick={() => form.setValue("type", "upload")}
                                >
                                    <Upload className="mr-2 h-4 w-4" /> File Upload
                                </Button>
                                <Button
                                    type="button"
                                    variant={form.watch("type") === "youtube" ? "default" : "outline"}
                                    className="h-12 rounded-xl border-2"
                                    onClick={() => form.setValue("type", "youtube")}
                                >
                                    <Youtube className="mr-2 h-4 w-4" /> YouTube Link
                                </Button>
                            </div>

                            {form.watch("type") === "upload" ? (
                                <div className="space-y-4">
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-2xl p-8 text-center bg-muted/30 transition-all cursor-pointer",
                                            videoFile ? "border-green-500/50 bg-green-50/10" : "hover:bg-muted/50 border-muted"
                                        )}
                                        onClick={() => document.getElementById('video-upload')?.click()}
                                    >
                                        <Upload className={cn("w-10 h-10 mx-auto mb-4", videoFile ? "text-green-500" : "text-muted-foreground")} />
                                        {videoFile ? (
                                            <div>
                                                <p className="font-bold text-sm text-green-700">{videoFile.name}</p>
                                                <p className="text-xs text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium text-sm">Tap to select your project video</p>
                                                <p className="text-xs text-muted-foreground mt-1">MP4 or MOV • Max 50MB</p>
                                            </div>
                                        )}
                                        <Input id="video-upload" type="file" className="hidden" accept="video/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setVideoFile(file);
                                        }} />
                                    </div>
                                    {uploadProgress > 0 && <Progress value={uploadProgress} className="h-2 rounded-full" />}
                                </div>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="youtube_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>YouTube Link</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://youtube.com/watch?v=..." className="h-12 rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <div className="flex gap-4 pt-8 border-t">
                        {currentStep > 1 && (
                            <Button type="button" variant="outline" size="lg" className="flex-1 h-12 rounded-xl" onClick={prevStep} disabled={loading}>
                                <ChevronLeft className="mr-2 w-4 h-4" /> Back
                            </Button>
                        )}
                        {currentStep < steps.length ? (
                            <Button type="button" size="lg" className="flex-1 h-12 rounded-xl" onClick={nextStep}>
                                Continue <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        ) : (
                            <Button type="submit" size="lg" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-purple-600 shadow-xl shadow-primary/20" disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finish & Submit <Rocket className="ml-2 w-4 h-4" /></>}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
