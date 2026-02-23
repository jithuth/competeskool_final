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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Youtube } from "lucide-react";

export function SubmissionForm({ events }: { events: any[] }) {
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
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

    const submissionType = form.watch("type");

    async function handleFileUpload(file: File) {
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File size exceeds 50MB limit.");
            return;
        }

        const { getCurrentUserAction } = await import('@/app/actions/session');
        let user: any = null;
        const sessionInfo = await getCurrentUserAction();
        if (sessionInfo) { user = { id: sessionInfo.userId }; }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

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
        setLoading(true);
        const { getCurrentUserAction } = await import('@/app/actions/session');
        let user = null;
        const sessionInfo = await getCurrentUserAction();
        if (sessionInfo) { user = { id: sessionInfo.userId }; }

        let videoData = { url: values.video_url, path: "" };

        if (values.type === "upload") {
            const fileInput = document.getElementById("video-upload") as HTMLInputElement;
            const file = fileInput?.files?.[0];
            if (file) {
                const uploaded = await handleFileUpload(file);
                if (!uploaded) {
                    setLoading(false);
                    return;
                }
                videoData = uploaded;
            } else if (!values.video_url) {
                toast.error("Please select a video file to upload.");
                setLoading(false);
                return;
            }
        }

        // Direct insert using Supabase
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="event_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select Competition</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose an active event" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Submission Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter a catchy title for your entry" {...field} />
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
                            <FormLabel>Brief Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Explain your project..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormLabel>Project Video</FormLabel>
                    <Tabs defaultValue="upload" onValueChange={(v) => form.setValue("type", v as any)}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload" className="gap-2">
                                <Upload className="w-4 h-4" /> Upload Video
                            </TabsTrigger>
                            <TabsTrigger value="youtube" className="gap-2">
                                <Youtube className="w-4 h-4" /> YouTube Link
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="space-y-4 pt-4">
                            <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                                <div>
                                    <p className="font-medium text-sm">Click to upload or drag and drop</p>
                                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV up to 50MB</p>
                                </div>
                                <Input id="video-upload" type="file" className="hidden" accept="video/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        toast.info(`Selected: ${file.name}`);
                                    }
                                }} />
                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('video-upload')?.click()}>
                                    Browse Files
                                </Button>
                                {uploadProgress > 0 && (
                                    <div className="w-full bg-muted rounded-full h-2 mt-4 overflow-hidden">
                                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="youtube" className="pt-4">
                            <FormField
                                control={form.control}
                                name="youtube_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-outfit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing Submission...
                        </>
                    ) : "Submit Project"}
                </Button>
            </form>
        </Form>
    );
}
