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
import { createAdminUserAction } from "@/app/actions/admin";

const judgeSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password at least 6 characters"),
    expertise: z.string().min(2, "Expertise is required"),
    bio: z.string().optional(),
});

type JudgeFormValues = z.infer<typeof judgeSchema>;

export function JudgeForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const form = useForm<JudgeFormValues>({
        resolver: zodResolver(judgeSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            expertise: "",
            bio: "",
        },
    });

    async function onSubmit(values: JudgeFormValues) {
        setLoading(true);

        const res = await createAdminUserAction({
            ...values,
            role: 'judge'
        });

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Judge created and approved!");
            if (onSuccess) onSuccess();
            router.refresh();
        }

        setLoading(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Expert Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="judge@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="expertise"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Expertise</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Science, Arts, Robotics" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bio (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Short biography..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Judge"}
                </Button>
            </form>
        </Form>
    );
}
