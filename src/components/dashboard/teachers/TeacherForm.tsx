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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveUserProfileAction, createAdminUserAction } from "@/app/actions/admin";

const teacherSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    class_section: z.string().min(1, "Class and Section is required"),
    school_id: z.string().optional(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export function TeacherForm({ schoolId, initialData, isSuperAdmin, schools, onSuccess }: { schoolId?: string, initialData?: any, isSuperAdmin?: boolean, schools?: { id: string, name: string }[], onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const form = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema),
        defaultValues: {
            full_name: initialData?.full_name || "",
            email: initialData?.email || "",
            password: "",
            class_section: initialData?.class_section || "",
            school_id: initialData?.school_id || schoolId || "",
        },
    });

    async function onSubmit(values: TeacherFormValues) {
        setLoading(true);

        let res;
        if (initialData?.id) {
            res = await saveUserProfileAction({
                id: initialData.id,
                full_name: values.full_name,
                class_section: values.class_section,
                school_id: values.school_id
            });
        } else {
            res = await createAdminUserAction({
                ...values,
                role: 'teacher',
                school_id: isSuperAdmin ? values.school_id : schoolId,
            });
        }

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(initialData?.id ? "Teacher profile updated!" : "Teacher account created!");
            if (onSuccess) onSuccess();
            router.refresh();
        }

        setLoading(false);
    }

    const isEdit = !!initialData?.id;

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

                {!isEdit && (
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
                )}

                {isSuperAdmin && (
                    <FormField
                        control={form.control}
                        name="school_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Assign to School</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 border-2">
                                            <SelectValue placeholder="Select a school" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {schools?.map(school => (
                                            <SelectItem key={school.id} value={school.id}>
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="class_section"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Class & Section</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Grade 10 - Section A" className="h-12 rounded-xl border-slate-200 border-2" {...field} />
                            </FormControl>
                            {!isEdit && <p className="text-[10px] text-slate-400 font-medium">This teacher will be responsible for approving students from this class.</p>}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-bold uppercase tracking-widest text-xs" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEdit ? "Update Profile" : "Register Teacher"}
                </Button>
            </form>
        </Form>
    );
}
