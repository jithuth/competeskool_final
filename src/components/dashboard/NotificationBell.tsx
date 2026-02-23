"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Info, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotificationsAction } from "@/app/actions/notifications";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        const data = await getNotificationsAction();
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds for new alerts
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-11 h-11 rounded-2xl bg-white border shadow-sm relative group hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-[1.5rem] border-2 shadow-2xl p-4 gap-2 flex flex-col mt-2">
                <div className="flex items-center justify-between px-2 py-1">
                    <DropdownMenuLabel className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Alert Center
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Badge className="bg-indigo-600 text-white border-none rounded-full px-2 py-0 text-[9px] font-black">
                            {unreadCount} New
                        </Badge>
                    )}
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />

                <div className="max-h-[350px] overflow-y-auto space-y-2 py-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="py-8 text-center space-y-2">
                            <Mail className="w-8 h-8 text-slate-200 mx-auto" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem key={n.id} className="rounded-xl p-3 flex flex-col items-start gap-1 transition-colors hover:bg-slate-50 cursor-default focus:bg-slate-50">
                                <div className="flex items-center gap-2 w-full">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        n.is_read ? "bg-slate-200" : "bg-indigo-600"
                                    )} />
                                    <span className="text-xs font-black text-slate-900 border-b-2 border-indigo-100">{n.title}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-4">
                                    {n.message}
                                </p>
                                <div className="flex items-center justify-between w-full pl-4 mt-1">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase">
                                        {format(new Date(n.created_at), "HH:mm, dd MMM")}
                                    </span>
                                    {n.events?.title && (
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-slate-100 py-0 leading-none h-4">
                                            {n.events.title}
                                        </Badge>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="bg-slate-100" />
                <Button variant="ghost" className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-9">
                    View All Activity
                </Button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
