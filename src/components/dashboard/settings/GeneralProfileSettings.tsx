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
import { Loader2, User, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function GeneralProfileSettings({ profile }: { profile: any }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: profile?.full_name || "",
        },
    });

    async function onSubmit(values: ProfileFormValues) {
        setLoading(true);
        const { error } = await supabase
            .from("profiles")
            .update(values)
            .eq("id", profile.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Profile updated!");
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 pb-10 border-b border-dashed mb-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <User className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black font-outfit uppercase tracking-tight">Identity Details</h3>
                    <p className="text-sm text-slate-500 font-medium">Your display name across the platform.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                    <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Full Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Full Name"
                                        className="h-12 bg-white rounded-xl border-slate-200"
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
                        className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Update Identity <Sparkles className="ml-2 w-4 h-4" /></>}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
