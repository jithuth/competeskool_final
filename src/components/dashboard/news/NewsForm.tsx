"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const newsSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    content: z.string().min(20, "Content must be at least 20 characters"),
    image_url: z.string().url().optional().or(z.literal("")),
});

type NewsFormValues = z.infer<typeof newsSchema>;

export function NewsForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const form = useForm<NewsFormValues>({
        resolver: zodResolver(newsSchema),
        defaultValues: initialData || {
            title: "",
            content: "",
            image_url: "",
        },
    });

    async function onSubmit(values: NewsFormValues) {
        setLoading(true);
        const { getCurrentUserAction } = await import('@/app/actions/session');
        let user = null;
        const sessionInfo = await getCurrentUserAction();
        if (sessionInfo) { user = { id: sessionInfo.userId }; }

        const dataToSave = {
            ...values,
            created_by: user?.id,
        };

        let result;
        if (initialData?.id) {
            result = await supabase
                .from("news")
                .update(dataToSave)
                .eq("id", initialData.id);
        } else {
            result = await supabase
                .from("news")
                .insert(dataToSave);
        }

        if (result.error) {
            toast.error(result.error.message);
            setLoading(false);
            return;
        }

        toast.success(initialData?.id ? "News updated!" : "News published!");
        if (onSuccess) onSuccess();
        router.refresh();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>News Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Breaking: Annual Science Fair Winners Announced!" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Content</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Write the full news article here..." className="h-48" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cover Image URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialData ? "Update News" : "Publish News")}
                </Button>
            </form>
        </Form>
    );
}
