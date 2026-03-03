"use client";

import { useState, useEffect, useCallback } from "react";
import { getNewsAction, deleteNewsAction } from "@/app/actions/news";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Plus, Search, Filter, Loader2, Edit3, Trash2,
    Calendar, User, Globe, FileText, Image as ImageIcon,
    MoreHorizontal, ArrowUpRight, Megaphone, Newspaper
} from "lucide-react";
import { Input } from "@/components/ui/input";
import NewsForm from "@/components/dashboard/news/NewsForm";
import { format } from "date-fns";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function NewsManagementPage() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getNewsAction();
            if (res.success) {
                setNews(res.documents || []);
            } else {
                toast.error(res.error || "Failed to load news");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;

        try {
            const res = await deleteNewsAction(id);
            if (res.success) {
                toast.success("News item deleted");
                fetchNews();
            } else {
                toast.error(res.error || "Failed to delete news");
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const filteredNews = news.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isFormOpen) {
        return (
            <div className="container mx-auto py-10">
                <NewsForm
                    initialData={editingItem}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        setEditingItem(null);
                        fetchNews();
                    }}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingItem(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-8 bg-primary rounded-full shadow-sm" />
                        <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter text-slate-900 leading-none">
                            News <span className="text-primary italic">Central</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] ml-4">
                        Manage public announcements and story telling across the platform
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find by headline or content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 w-80 rounded-2xl bg-white border-slate-100 pl-12 font-bold text-xs focus:ring-primary/10 transition-all border-2"
                        />
                    </div>
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        className="h-14 px-8 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 group/btn"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90 duration-300" /> New Article
                    </Button>
                </div>
            </div>

            {/* Quick Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-[2.5rem] bg-indigo-50/50 border-2 border-indigo-100/50 flex items-center gap-6 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-xl shadow-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-[10deg] transition-transform duration-500 border border-indigo-50">
                        <Newspaper className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 leading-none">Total Articles</p>
                        <p className="text-4xl font-black font-outfit text-slate-900 tracking-tighter leading-none">{news.length}</p>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-emerald-50/50 border-2 border-emerald-100/50 flex items-center gap-6 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-xl shadow-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:rotate-[10deg] transition-transform duration-500 border border-emerald-50">
                        <Globe className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1 leading-none">Public Reach</p>
                        <p className="text-4xl font-black font-outfit text-slate-900 tracking-tighter leading-none">{news.filter(n => new Date(n.published_at) <= new Date()).length}</p>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100/50 flex items-center gap-6 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-xl shadow-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:rotate-[10deg] transition-transform duration-500 border border-slate-50">
                        <Megaphone className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 leading-none">Draft Mode</p>
                        <p className="text-4xl font-black font-outfit text-slate-900 tracking-tighter leading-none">{news.filter(n => new Date(n.published_at) > new Date()).length}</p>
                    </div>
                </div>
            </div>

            {/* Content Display */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Syncing Intelligence Feed...</p>
                </div>
            ) : filteredNews.length > 0 ? (
                <div className="grid gap-6">
                    {filteredNews.map((item) => (
                        <div key={item.$id} className="group relative">
                            {/* Floating status badge */}
                            <div className={cn(
                                "absolute -top-3 -right-3 z-10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 shadow-sm transition-all group-hover:scale-110",
                                new Date(item.published_at) <= new Date()
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                                {new Date(item.published_at) <= new Date() ? "Live" : "Scheduled"}
                            </div>

                            <div className="p-8 rounded-[3rem] bg-white border-2 border-slate-50 hover:border-primary/10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col md:flex-row gap-8 items-center bg-white/80 backdrop-blur-sm shadow-sm">
                                {/* Thumbnail */}
                                <div className="w-full md:w-60 h-40 rounded-[2rem] overflow-hidden bg-slate-100 border-2 border-white shadow-inner flex-shrink-0 relative group/thumb">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <Link href={`/news/${item.$id}`} target="_blank">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/20 hover:bg-white text-white hover:text-primary border border-white/30 backdrop-blur-md">
                                                <ArrowUpRight className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-primary" /> {format(new Date(item.published_at), "MMM dd, yyyy")}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-primary" /> {item.created_by?.slice(0, 8) || "Admin"}</span>
                                    </div>

                                    <h3 className="text-2xl font-black font-outfit uppercase tracking-tight text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                        {item.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Badge variant="ghost" className="bg-slate-50 text-slate-500 border-none px-4 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-widest gap-2">
                                            <FileText className="w-3 h-3" /> {item.content.length} characters
                                        </Badge>
                                        <Badge variant="ghost" className="bg-slate-50 text-slate-500 border-none px-4 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-widest gap-2">
                                            <ImageIcon className="w-3 h-3" /> {item.image_url ? "Has Header" : "No Header"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pr-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleEdit(item)}
                                        className="h-12 px-6 rounded-2xl border-2 border-slate-100 text-slate-600 font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 mr-2" /> Modify Article
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-100 text-slate-400 transition-all">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-2 shadow-xl shadow-slate-200/50 outline-none">
                                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 p-3 italic">Article Commands</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-slate-100" />
                                            <DropdownMenuItem onClick={() => handleEdit(item)} className="rounded-xl p-3 focus:bg-indigo-50 focus:text-indigo-600 transition-colors cursor-pointer group">
                                                <Edit3 className="h-4 w-4 mr-3 text-slate-400 group-focus:text-indigo-600" />
                                                <span className="font-bold text-xs uppercase tracking-widest">Edit Details</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl p-3 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer group">
                                                <Globe className="h-4 w-4 mr-3 text-slate-400 group-focus:text-primary" />
                                                <span className="font-bold text-xs uppercase tracking-widest">View Public</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-100" />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(item.$id)}
                                                className="rounded-xl p-3 focus:bg-red-50 focus:text-red-600 transition-colors cursor-pointer group text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4 mr-3 text-red-400 group-focus:text-red-600" />
                                                <span className="font-bold text-xs uppercase tracking-widest">Delete Forever</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 group hover:bg-white hover:border-primary/20 transition-all duration-700">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500 border border-slate-50">
                        <Newspaper className="w-10 h-10 text-slate-200 group-hover:text-primary/30 transition-colors" />
                    </div>
                    <h3 className="text-3xl font-black font-outfit uppercase tracking-tighter text-slate-400 group-hover:text-slate-800 transition-colors">Press Room Empty</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 mb-8 ml-4">Start your first publication now</p>
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        className="h-14 px-10 rounded-2xl bg-slate-900 text-white hover:bg-primary transition-all font-black uppercase tracking-widest text-xs gap-3 shadow-xl hover:shadow-primary/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Initialize Article
                    </Button>
                </div>
            )}
        </div>
    );
}
