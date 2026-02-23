"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Rocket, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditSubmissionPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const form = useForm<SubmissionFormValues>({
        resolver: zodResolver(submissionSchema),
        defaultValues: {
            title: "",
            description: "",
            event_id: "",
            type: "upload",
        },
    });

    useEffect(() => {
        async function loadSubmission() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: sub, error } = await supabase
                .from("submissions")
                .select("*, submission_videos(*)")
                .eq("id", id)
                .single();

            if (error || !sub) {
                toast.error("Submission not found");
                router.push("/dashboard/my-submissions");
                return;
            }

            if (sub.student_id !== user.id) {
                toast.error("Unauthorized");
                router.push("/dashboard/my-submissions");
                return;
            }

            if (sub.status !== 'pending') {
                toast.error("Only pending submissions can be edited");
                router.push("/dashboard/my-submissions");
                return;
            }

            const video = sub.submission_videos?.[0];
            form.reset({
                title: sub.title,
                description: sub.description,
                event_id: sub.event_id,
                type: video?.type || "upload",
                youtube_url: video?.youtube_url || "",
                video_url: video?.video_url || "placeholder", // Validating against schema but not used for update here
            });
            setLoading(false);
        }
        loadSubmission();
    }, [id, supabase, router, form]);

    async function onSubmit(values: SubmissionFormValues) {
        setSaving(true);

        // Update main submission details
        const { error: subError } = await supabase
            .from("submissions")
            .update({
                title: values.title,
                description: values.description,
            })
            .eq("id", id);

        if (subError) {
            toast.error(subError.message);
            setSaving(false);
            return;
        }

        // Update video details if it's a youtube link
        if (values.type === 'youtube') {
            const { error: videoError } = await supabase
                .from("submission_videos")
                .update({
                    youtube_url: values.youtube_url,
                    video_url: null,
                    storage_path: null,
                })
                .eq("submission_id", id);

            if (videoError) {
                toast.error(videoError.message);
                setSaving(false);
                return;
            }
        }

        toast.success("Submission updated successfully!");
        router.push("/dashboard/my-submissions");
        router.refresh();
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 font-bold text-slate-400 uppercase tracking-widest text-xs">Fetching your entry...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <Link href="/dashboard/my-submissions" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors gap-2 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Submissions
                </Link>
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-black font-outfit uppercase tracking-tight text-slate-800">Edit Submission</h1>
                <p className="text-slate-500 font-medium text-lg">Update your project details before the final review.</p>
            </div>

            <div className="bg-card border-2 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-400">Project Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-14 rounded-2xl border-2 font-bold text-lg focus:ring-primary/20" />
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
                                    <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-400">Project Story</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="min-h-[200px] rounded-2xl border-2 font-medium text-lg focus:ring-primary/20" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch("type") === "youtube" && (
                            <FormField
                                control={form.control}
                                name="youtube_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-400">YouTube URL</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="h-14 rounded-2xl border-2 font-bold focus:ring-primary/20" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="pt-4 flex gap-4">
                            <Button type="submit" size="lg" className="flex-1 h-16 rounded-2xl bg-gradient-to-r from-primary to-purple-600 shadow-xl shadow-primary/30 font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02]" disabled={saving}>
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Save Changes <Save className="ml-2 w-5 h-5" /></>}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
