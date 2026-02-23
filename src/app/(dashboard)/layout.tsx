import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/lib/types";
import { Bell, Hexagon, Command, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .single();

    const role = (profile?.role || "student") as UserRole;

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f6f9]">
            <Sidebar role={role} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Decorative Background Blob */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />

                <header className="h-20 border-b bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black font-outfit text-slate-900 leading-none mb-1 capitalize">
                                {role.replace('_', ' ')} Portal
                            </h2>
                            <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Link href="/dashboard" className="hover:text-indigo-600">Home</Link>
                                <span>/</span>
                                <span className="text-slate-900">Dashboard</span>
                            </nav>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <NotificationBell />
                        </div>

                        <div className="h-10 w-[1px] bg-slate-200" />

                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{profile?.full_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{role?.replace('_', ' ')}</p>
                            </div>
                            <div className="relative">
                                <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-xl transition-transform group-hover:scale-110">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg">
                                        {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-white flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
