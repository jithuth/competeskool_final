"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { registerSchoolAction } from "@/app/actions/auth";
import { Loader2, School, User, Mail, Lock, MapPin, ArrowLeft, Send, CheckCircle2, Shield } from "lucide-react";

const schoolRegisterSchema = z.object({
    school_name: z.string().min(3, "School name is required"),
    school_address: z.string().min(5, "Address is required"),
    admin_name: z.string().min(2, "Admin name is required"),
    admin_email: z.string().email("Invalid email"),
    admin_password: z.string().min(6, "Password must be at least 6 characters"),
});

type SchoolRegisterValues = z.infer<typeof schoolRegisterSchema>;

export default function RegisterSchoolPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const form = useForm<SchoolRegisterValues>({
        resolver: zodResolver(schoolRegisterSchema),
        defaultValues: {
            school_name: "",
            school_address: "",
            admin_name: "",
            admin_email: "",
            admin_password: "",
        },
    });

    async function onSubmit(values: SchoolRegisterValues) {
        setLoading(true);

        const result = await registerSchoolAction(values);

        if (result.error) {
            toast.error(result.error);
            setLoading(false);
            return;
        }

        toast.success("Partnership request submitted! Our team will review your application.");
        router.push("/login?message=registration_pending");
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left side: Content & Partnership info */}
            <div className="hidden lg:flex w-1/2 relative bg-indigo-950 overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-90" />

                <div className="relative z-10 max-w-lg space-y-12">
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <School className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-5xl font-bold font-outfit text-white leading-tight">
                            Partner with <br />
                            <span className="text-indigo-400">CompeteEdu</span>
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed font-light">
                            Empower your students with a digital stage to showcase their excellence and compete on a global level.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { title: "Centralized Management", desc: "Easily manage teachers, students, and competition entries from one dashboard.", icon: Shield },
                            { title: "Academic Recognition", desc: "Earn certifications and awards that boost your school's global standing.", icon: CheckCircle2 },
                            { title: "Secure Data Handling", desc: "Enterprise-grade security ensuring privacy for all your staff and students.", icon: Lock },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                                <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                                    <p className="text-sm text-slate-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side: Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <Link href="/" className="inline-block mb-8">
                            <span className="text-3xl font-bold font-outfit text-gradient">CompeteEdu</span>
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight font-outfit">School Registration</h2>
                        <p className="text-muted-foreground mt-2">Submit your institution's details for partnership approval.</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-2">
                                    <School className="w-3.5 h-3.5" /> Institution Information
                                </div>
                                <FormField
                                    control={form.control}
                                    name="school_name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">School Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Royal Academy of Arts"
                                                    className="h-12 rounded-xl bg-background border-primary/10 focus-visible:ring-indigo-500/20 transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="school_address"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location / Address</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="City, Country"
                                                        className="pl-10 h-12 rounded-xl bg-background border-primary/10 focus-visible:ring-indigo-500/20 transition-all"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-5 pt-4 border-t border-indigo-100">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-2">
                                    <User className="w-3.5 h-3.5" /> Administrator Credentials
                                </div>
                                <FormField
                                    control={form.control}
                                    name="admin_name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Full Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Full Name"
                                                    className="h-12 rounded-xl bg-background border-primary/10 transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="admin_email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="admin@school.com"
                                                        className="h-12 rounded-xl bg-background border-primary/10 transition-all"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="admin_password"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="h-12 rounded-xl bg-background border-primary/10 transition-all"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <>Request Partnership <Send className="ml-2 w-4 h-4" /></>}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-8 text-center space-y-4">
                        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
