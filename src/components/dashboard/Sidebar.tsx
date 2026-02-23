"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    Users,
    School,
    Trophy,
    Newspaper,
    Settings,
    LogOut,
    UserCheck,
    ClipboardList,
    Video,
    Sparkles,
    Search,
    ChevronRight,
    Globe,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

interface NavItem {
    title: string;
    href: string;
    icon: any;
    roles: UserRole[];
    category?: string;
}

const navItems: NavItem[] = [
    {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["super_admin", "school_admin", "teacher", "student", "judge"],
        category: "MAIN"
    },
    {
        title: "Events",
        href: "/dashboard/events",
        icon: Calendar,
        roles: ["super_admin"],
        category: "MANAGEMENT"
    },
    {
        title: "Schools",
        href: "/dashboard/schools",
        icon: School,
        roles: ["super_admin"],
        category: "MANAGEMENT"
    },
    {
        title: "Teachers",
        href: "/dashboard/teachers",
        icon: UserCheck,
        roles: ["super_admin", "school_admin"],
        category: "MANAGEMENT"
    },
    {
        title: "Students",
        href: "/dashboard/students",
        icon: Users,
        roles: ["super_admin", "school_admin", "teacher"],
        category: "MANAGEMENT"
    },
    {
        title: "My Submissions",
        href: "/dashboard/my-submissions",
        icon: Video,
        roles: ["student"],
        category: "PARTICIPATION"
    },
    {
        title: "Evaluate",
        href: "/dashboard/evaluate",
        icon: ClipboardList,
        roles: ["judge"],
        category: "PARTICIPATION"
    },
    {
        title: "Judges",
        href: "/dashboard/judges",
        icon: UserCheck,
        roles: ["super_admin"],
        category: "MANAGEMENT"
    },
    {
        title: "Rankings",
        href: "/dashboard/rankings",
        icon: Trophy,
        roles: ["super_admin", "school_admin", "teacher", "student", "judge"],
        category: "MAIN"
    },
    {
        title: "News",
        href: "/dashboard/news",
        icon: Newspaper,
        roles: ["super_admin"],
        category: "CONTENT"
    },
    {
        title: "Site Management",
        href: "/dashboard/cms",
        icon: Globe,
        roles: ["super_admin"],
        category: "CONTENT"
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: UserCheck,
        roles: ["super_admin", "school_admin", "teacher", "student", "judge"],
        category: "MAIN"
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["super_admin", "school_admin", "teacher", "student", "judge"],
        category: "MAIN"
    },
];

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function Sidebar({ role }: { role: UserRole }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const { logoutAction } = await import('@/app/actions/auth');
            await logoutAction();
            toast.success("Logged out successfully");
            router.push("/login"); // Force redirect to login page
        } catch (error) {
            toast.error("Error logging out");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

    // Group by category
    const categories = Array.from(new Set(filteredNavItems.map(item => item.category || "OTHER")));

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white w-72 border-r border-white/5 relative overflow-hidden group/sidebar transition-all duration-300">
            {/* Background Decorative Element */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent -z-10" />

            <div className="p-8 pt-10">
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-black text-2xl font-outfit tracking-tighter">
                        Compete<span className="text-indigo-400">Edu</span>
                    </span>
                </Link>
            </div>

            <div className="px-6 mb-6">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    <input
                        placeholder="Quick search..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-9 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pt-2">
                {categories.map((category) => (
                    <div key={category} className="space-y-2">
                        <p className="px-4 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                            {category}
                        </p>
                        <div className="space-y-1">
                            {filteredNavItems
                                .filter(item => item.category === category)
                                .map((item) => {
                                    const active = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative",
                                                active
                                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} />
                                            <span className="flex-1">{item.title}</span>
                                            {active && <ChevronRight className="w-4 h-4 opacity-70 animate-in slide-in-from-left-2" />}
                                        </Link>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-6 mt-auto border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-12 transition-all group"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">{isLoggingOut ? "Signing out..." : "Logout Session"}</span>
                </Button>

                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all group"
                >
                    <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>View Main Site</span>
                </Link>
            </div>
        </div>
    );
}
