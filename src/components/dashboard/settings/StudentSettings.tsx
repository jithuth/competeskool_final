"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, GraduationCap, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const studentSchema = z.object({
    phone: z.string().min(5, "Contact number is required"),
    father_name: z.string().min(2, "Father's name is required"),
    mother_name: z.string().min(2, "Mother's name is required"),
    grade_level: z.string().min(1, "Grade level is required"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export function StudentSettings({ initialData, profileId }: { initialData: any, profileId: string }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            phone: initialData?.phone || "",
            father_name: initialData?.father_name || "",
            mother_name: initialData?.mother_name || "",
            grade_level: initialData?.grade_level || "",
        },
    });

    async function onSubmit(values: StudentFormValues) {
        setLoading(true);
        const { error } = await supabase
            .from("students")
            .update(values)
            .eq("id", profileId);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Student profile updated!");
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black font-outfit uppercase tracking-tight">Student Profile</h3>
                    <p className="text-sm text-slate-500 font-medium">Keep your personal and guardian information up to date.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+251 ..."
                                            className="h-12 bg-white rounded-xl border-slate-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs font-bold" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="grade_level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Grade</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Grade 10"
                                            className="h-12 bg-white rounded-xl border-slate-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs font-bold" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="father_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Father's Full Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="..."
                                            className="h-12 bg-white rounded-xl border-slate-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs font-bold" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mother_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mother's Full Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="..."
                                            className="h-12 bg-white rounded-xl border-slate-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs font-bold" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save Student Profile <Save className="ml-2 w-4 h-4" /></>}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
