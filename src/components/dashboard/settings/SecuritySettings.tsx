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
import { Loader2, ShieldCheck, Key } from "lucide-react";

const passwordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SecuritySettings() {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: PasswordFormValues) {
        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            password: values.password
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password updated successfully!");
            form.reset();
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <Key className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black font-outfit uppercase tracking-tight">Security Credentials</h3>
                    <p className="text-sm text-slate-500 font-medium">Keep your account secure by updating your password regularly.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
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
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
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
                        className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Update Credentials <ShieldCheck className="ml-2 w-4 h-4" /></>}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
