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
import { Loader2, Mail, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: ForgotPasswordFormValues) {
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            redirectTo: `${window.location.origin}/dashboard/settings`,
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password reset link sent!");
            setSuccess(true);
            form.reset();
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[url('/noise.png')] relative">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 border border-slate-100">
                <div className="mb-8">
                    <Link href="/login" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                    </Link>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100">
                        <Mail className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-black font-outfit tracking-tight text-slate-900 mb-2">Forgot Password?</h1>
                    <p className="text-slate-500 font-medium text-sm">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {success ? (
                    <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl border border-emerald-100 text-center space-y-4">
                        <h3 className="font-outfit font-black text-lg">Check your inbox</h3>
                        <p className="text-sm font-medium">We have sent a password reset link to your email address.</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="you@example.com"
                                                    className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:border-indigo-500 shadow-sm transition-all"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold" />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Link <Send className="ml-2 w-4 h-4" /></>}
                            </Button>
                        </form>
                    </Form>
                )}
            </div>
        </div>
    );
}
