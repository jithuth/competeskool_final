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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const schoolSchema = z.object({
    name: z.string().min(2, "School name is required"),
    address: z.string().min(5, "Address is required"),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

export function SchoolSettings({ initialData }: { initialData: any }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const form = useForm<SchoolFormValues>({
        resolver: zodResolver(schoolSchema),
        defaultValues: {
            name: initialData?.name || "",
            address: initialData?.address || "",
        },
    });

    async function onSubmit(values: SchoolFormValues) {
        setLoading(true);
        const { error } = await supabase
            .from("schools")
            .update(values)
            .eq("id", initialData.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Institutional details updated!");
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <Building2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black font-outfit uppercase tracking-tight">Institutional Profile</h3>
                    <p className="text-sm text-slate-500 font-medium">Update the official information for your school.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Official School Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g. St. Xavier's Academy"
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
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mailing Address</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Full institutional address..."
                                        className="min-h-[100px] bg-white rounded-xl border-slate-200 resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs font-bold" />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save Changes <Save className="ml-2 w-4 h-4" /></>}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
