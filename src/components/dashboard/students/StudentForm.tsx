"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { saveUserProfileAction } from "@/app/actions/admin";

const studentSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    grade_level: z.string().min(1, "Grade level is required"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export function StudentForm({ initialData, onSuccess }: { initialData: any, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            full_name: initialData?.full_name || "",
            grade_level: initialData?.grade_level || "",
        },
    });

    async function onSubmit(values: StudentFormValues) {
        setLoading(true);

        const res = await saveUserProfileAction({
            id: initialData.id,
            full_name: values.full_name,
            grade_level: values.grade_level
        });

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Student profile updated!");
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
                                <Input placeholder="Student Full Name" className="h-12 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="grade_level"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Grade / Class</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Grade 10" className="h-12 rounded-xl border-slate-200 border-2" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-bold uppercase tracking-widest text-xs" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Student Profile"}
                </Button>
            </form>
        </Form>
    );
}
