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
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const schoolSchema = z.object({
    name: z.string().min(2, "School name is required"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    logo_url: z.string().url().optional().or(z.literal("")),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

export function SchoolForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const form = useForm<SchoolFormValues>({
        resolver: zodResolver(schoolSchema),
        defaultValues: {
            name: initialData?.name || "",
            address: initialData?.address || "",
            logo_url: initialData?.logo_url || "",
        },
    });

    async function onSubmit(values: SchoolFormValues) {
        setLoading(true);
        let result;
        if (initialData?.id) {
            result = await supabase
                .from("schools")
                .update(values)
                .eq("id", initialData.id);
        } else {
            result = await supabase
                .from("schools")
                .insert(values);
        }

        if (result.error) {
            toast.error(result.error.message);
            setLoading(false);
            return;
        }

        toast.success(initialData?.id ? "School updated!" : "School created!");
        if (onSuccess) onSuccess();
        router.refresh();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. International School" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Input placeholder="City, Country" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logo URL (optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save School"}
                </Button>
            </form>
        </Form>
    );
}
