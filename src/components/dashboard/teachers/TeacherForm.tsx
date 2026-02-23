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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { createAdminUserAction } from "@/app/actions/admin";

const teacherSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    class_section: z.string().min(1, "Class and Section is required"),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export function TeacherForm({ schoolId, onSuccess }: { schoolId: string, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const form = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            class_section: "",
        },
    });

    async function onSubmit(values: TeacherFormValues) {
        setLoading(true);

        const res = await createAdminUserAction({
            ...values,
            role: 'teacher',
            school_id: schoolId,
        });

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Teacher account created and assigned to class!");
            if (onSuccess) onSuccess();
            router.refresh();
        }

        setLoading(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Mr. John Doe" className="h-12 rounded-xl" {...field} />
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
                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Official Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="teacher@school.com" className="h-12 rounded-xl" {...field} />
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
                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Initial Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="class_section"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Class & Section</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Grade 10 - Section A" className="h-12 rounded-xl border-slate-200 border-2" {...field} />
                            </FormControl>
                            <p className="text-[10px] text-slate-400 font-medium">This teacher will be responsible for approving students from this class.</p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-bold uppercase tracking-widest text-xs" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register Teacher"}
                </Button>
            </form>
        </Form>
    );
}
