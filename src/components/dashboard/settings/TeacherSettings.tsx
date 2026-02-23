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
import { Loader2, UserCheck, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const teacherSchema = z.object({
    class_section: z.string().min(1, "Class & Section is required"),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export function TeacherSettings({ initialData, profileId }: { initialData: any, profileId: string }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const form = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema),
        defaultValues: {
            class_section: initialData?.class_section || "",
        },
    });

    async function onSubmit(values: TeacherFormValues) {
        setLoading(true);
        const { error } = await supabase
            .from("teachers")
            .update(values)
            .eq("id", profileId);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Teacher profile updated!");
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <UserCheck className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black font-outfit uppercase tracking-tight">Academic Profile</h3>
                    <p className="text-sm text-slate-500 font-medium">Manage your classroom assignments and professional details.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                    <FormField
                        control={form.control}
                        name="class_section"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned Class & Section</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g. Grade 10 - Section B"
                                        className="h-12 bg-white rounded-xl border-slate-200"
                                        {...field}
                                    />
                                </FormControl>
                                <p className="text-[10px] text-slate-400 font-medium">This defines the students you oversee for competition approvals.</p>
                                <FormMessage className="text-xs font-bold" />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-purple-200 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save Professional Data <Save className="ml-2 w-4 h-4" /></>}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
