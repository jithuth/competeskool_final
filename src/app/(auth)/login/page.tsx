"use client";

import { Suspense } from 'react';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginAction, registerAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2, Mail, Lock, ArrowRight, Star, Quote,
    User, Phone, GraduationCap, Send, ShieldCheck,
    LogIn, UserPlus, School
} from "lucide-react";

// --- Schemas ---
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Valid phone number is required"),
    school_id: z.string().min(1, "Please select your school"),
    father_name: z.string().min(2, "Father's name is required"),
    mother_name: z.string().min(2, "Mother's name is required"),
    grade_level: z.string().min(1, "Grade level is required"),
    teacher_id: z.string().min(1, "Please select your teacher"),
    consent: z.boolean().refine(val => val === true, {
        message: "You must agree to verify details with your school",
    }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function AuthContent() {
    const [activeTab, setActiveTab] = useState<string>("login");
    const [loading, setLoading] = useState(false);
    const [schools, setSchools] = useState<any[]>([]);
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Switch tabs based on URL
    useEffect(() => {
        const view = searchParams.get("view");
        if (view === "signup") setActiveTab("signup");
        if (view === "login") setActiveTab("login");
    }, [searchParams]);

    const message = searchParams.get("message");

    // --- Forms ---
    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const signupForm = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            phone: "",
            school_id: "",
            father_name: "",
            mother_name: "",
            grade_level: "",
            teacher_id: "",
            consent: false,
        },
    });

    // --- Effects ---
    useEffect(() => {
        if (message === "registration_pending") {
            toast.info("Registration request submitted. Please wait for approval.");
        }
    }, [message]);

    useEffect(() => {
        async function fetchSchools() {
            const { data } = await supabase.from("schools").select("id, name").eq("status", "approved");
            if (data) setSchools(data);
        }
        fetchSchools();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { setValue } = signupForm;
    const selectedSchool = signupForm.watch("school_id");
    useEffect(() => {
        if (!selectedSchool) {
            setAllTeachers([]);
            setAvailableClasses([]);
            setFilteredTeachers([]);
            return;
        }

        async function fetchTeachers() {
            // Fetch teachers for the selected school
            const { data, error } = await supabase
                .from("profiles")
                .select(`
                    id, 
                    full_name, 
                    teachers!teachers_id_fkey (class_section)
                `)
                .eq("school_id", selectedSchool)
                .eq("role", "teacher")
                .eq("status", "approved");

            if (error) {
                console.error("Error fetching teachers:", error);
                return;
            }

            if (data) {
                const teachersWithDetails = data.map((p: any) => {
                    // Handle both array and object responses from Supabase join
                    const teacherData = Array.isArray(p.teachers) ? p.teachers[0] : p.teachers;
                    return {
                        id: p.id,
                        full_name: p.full_name,
                        grade: teacherData?.class_section || "Unassigned"
                    };
                });

                setAllTeachers(teachersWithDetails);

                // Get unique sections/classes
                const classes = Array.from(new Set(
                    teachersWithDetails
                        .map((t: any) => t.grade)
                        .filter(c => c !== "Unassigned")
                )) as string[];

                setAvailableClasses(classes);
            }
        }

        // Reset dependent fields
        setValue("grade_level", "");
        setValue("teacher_id", "");
        fetchTeachers();
    }, [selectedSchool, supabase, setValue]);

    const selectedGrade = signupForm.watch("grade_level");
    useEffect(() => {
        if (!selectedGrade) {
            setFilteredTeachers([]);
            setValue("teacher_id", "");
            return;
        }

        const filtered = allTeachers.filter(t => t.grade === selectedGrade);
        setFilteredTeachers(filtered);

        // Automatically set the first teacher found for this section
        if (filtered.length > 0) {
            setValue("teacher_id", filtered[0].id);
        } else {
            setValue("teacher_id", "");
        }
    }, [selectedGrade, allTeachers, setValue]);
    // --- Handlers ---
    async function onLoginSubmit(values: LoginFormValues) {
        setLoading(true);
        const result = await loginAction(values);

        if (result.error) {
            toast.error(result.error);
            setLoading(false);
            return;
        }

        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
    }

    async function onSignupSubmit(values: SignupFormValues) {
        setLoading(true);
        const result = await registerAction(values);

        if (result.error) {
            toast.error(result.error);
            setLoading(false);
            return;
        }

        toast.success("Registration successful! Pending teacher approval.");
        setActiveTab("login");
        setLoading(false);
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left side: Premium Branding */}
            <div className="hidden lg:flex w-2/5 relative bg-slate-950 overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-950 to-purple-900/20" />
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

                <div className="relative z-10 max-w-md space-y-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                            <Star className="w-3.5 h-3.5 fill-indigo-400" />
                            <span>Academic Excellence</span>
                        </div>
                        <h1 className="text-6xl font-black font-outfit text-white leading-tight">
                            Elevate Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-black">Future</span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                            The unified platform for tomorrow's leaders to compete, collaborate, and conquer.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl border border-white/5 space-y-6 shadow-2xl relative group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Quote className="w-12 h-12 text-white" />
                        </div>
                        <p className="text-lg text-slate-300 font-medium leading-relaxed italic">
                            "This ecosystem has bridged the gap between raw talent and international recognition for our students."
                        </p>
                        <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5 shadow-xl">
                                <div className="w-full h-full rounded-[0.85rem] bg-slate-900 flex items-center justify-center font-black text-white">DR</div>
                            </div>
                            <div>
                                <div className="font-black text-white text-sm">Dr. Raymond Vance</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Educational Director</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Forms */}
            <div className="w-full lg:w-3/5 flex items-center justify-center p-6 md:p-12 bg-slate-50/50 relative overflow-y-auto">
                <div className="w-full max-w-2xl">
                    <div className="mb-10 flex flex-col items-center lg:items-start">
                        <Link href="/" className="mb-8 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:rotate-12 transition-transform">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-3xl font-black font-outfit tracking-tighter text-slate-900">CompeteEdu</span>
                            </div>
                        </Link>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex items-center justify-between mb-8 w-full">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black font-outfit text-slate-900">
                                        {activeTab === 'login' ? 'Welcome back' : 'Start your journey'}
                                    </h2>
                                    <p className="text-slate-500 font-medium text-sm">
                                        {activeTab === 'login' ? 'Access your performance dashboard.' : 'Register as a student to participate.'}
                                    </p>
                                </div>
                                <TabsList className="bg-slate-200/50 p-1 rounded-2xl border border-slate-200">
                                    <TabsTrigger value="login" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest transition-all">
                                        Login
                                    </TabsTrigger>
                                    <TabsTrigger value="signup" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest transition-all">
                                        Register
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                                <Form {...loginForm}>
                                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                                        <FormField
                                            control={loginForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <Input placeholder="you@example.com" className="pl-12 h-14 rounded-2xl bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm transition-all text-sm font-medium" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={loginForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</FormLabel>
                                                        <Link href="/forgot-password" className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline">
                                                            Forgot?
                                                        </Link>
                                                    </div>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <Input type="password" placeholder="••••••••" className="pl-12 h-14 rounded-2xl bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm transition-all text-sm font-medium" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] mt-4" disabled={loading}>
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
                                        </Button>
                                    </form>
                                </Form>

                                <div className="mt-8 pt-8 border-t border-slate-200">
                                    <div className="flex flex-col gap-4">
                                        <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest italic">Institutional Access</p>
                                        <Link href="/register-school">
                                            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all">
                                                <School className="w-4 h-4 mr-2" /> Register Your School
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                                <Form {...signupForm}>
                                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField control={signupForm.control} name="full_name" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</FormLabel><FormControl><Input placeholder="John Doe" className="h-12 rounded-xl bg-white text-sm font-medium" {...field} /></FormControl><FormMessage className="text-xs font-bold" /></FormItem>
                                            )} />
                                            <FormField control={signupForm.control} name="email" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</FormLabel><FormControl><Input placeholder="john@school.com" className="h-12 rounded-xl bg-white text-sm font-medium" {...field} /></FormControl><FormMessage className="text-xs font-bold" /></FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField control={signupForm.control} name="password" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-white text-sm font-medium" {...field} /></FormControl><FormMessage className="text-xs font-bold" /></FormItem>
                                            )} />
                                            <FormField control={signupForm.control} name="phone" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number</FormLabel><FormControl><Input placeholder="+1 234..." className="h-12 rounded-xl bg-white text-sm font-medium" {...field} /></FormControl><FormMessage className="text-xs font-bold" /></FormItem>
                                            )} />
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">Academic Information</p>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <FormField control={signupForm.control} name="school_id" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">School</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl><SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Institution" /></SelectTrigger></FormControl>
                                                            <SelectContent>{schools.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}{schools.length === 0 && <SelectItem value="none" disabled>No approved schools</SelectItem>}</SelectContent>
                                                        </Select><FormMessage className="text-xs font-bold" />
                                                    </FormItem>
                                                )} />
                                                <FormField control={signupForm.control} name="grade_level" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Section/Grade</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSchool}>
                                                            <FormControl><SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Section" /></SelectTrigger></FormControl>
                                                            <SelectContent>{availableClasses.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}{availableClasses.length === 0 && <SelectItem value="none" disabled>No sections available</SelectItem>}</SelectContent>
                                                        </Select><FormMessage className="text-xs font-bold" />
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <FormField control={signupForm.control} name="teacher_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mentor Teacher</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            readOnly
                                                            placeholder="Select section first"
                                                            className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-900 cursor-not-allowed"
                                                            value={filteredTeachers.find(t => t.id === field.value)?.full_name || ""}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                                            <FormField control={signupForm.control} name="father_name" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Father's Name</FormLabel><FormControl><Input placeholder="Full Name" className="h-12 rounded-xl bg-white text-sm font-medium" {...field} /></FormControl><FormMessage className="text-xs font-bold" /></FormItem>
                                            )} />
                                            <FormField control={signupForm.control} name="mother_name" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mother's Name</FormLabel><FormControl><Input placeholder="Full Name" className="h-12 rounded-xl bg-white text-sm font-medium" {...field} /></FormControl><FormMessage className="text-xs font-bold" /></FormItem>
                                            )} />
                                        </div>

                                        <div className="bg-slate-200/50 p-4 rounded-2xl border border-slate-200">
                                            <FormField control={signupForm.control} name="consent" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="w-4 h-4 rounded border-2 border-indigo-600 data-[state=checked]:bg-indigo-600" /></FormControl>
                                                    <FormLabel className="text-[10px] font-bold text-slate-600 leading-tight">I verify that all details are true and consent to school verification.</FormLabel>
                                                </FormItem>
                                            )} />
                                            <FormMessage className="mt-2 text-xs font-bold" />
                                        </div>

                                        <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]" disabled={loading}>
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Enrollment <UserPlus className="ml-2 w-4 h-4" /></>}
                                        </Button>
                                    </form>
                                </Form>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
            <AuthContent />
        </Suspense>
    );
}

