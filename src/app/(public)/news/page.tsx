import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function NewsPage() {
    const supabase = await createClient();
    const { data: newsItems } = await supabase
        .from("news")
        .select(`
      *,
      profiles (full_name)
    `)
        .order("published_at", { ascending: false });

    return (
        <div className="bg-[#080B1A] min-h-screen py-32">
            <div className="container mx-auto px-6 space-y-16 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="text-center space-y-6 relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-1.5 bg-primary" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white drop-shadow-sm">
                        Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">Updates</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                        Keep up with the latest announcements, winners, and stories from our vibrant student community.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {newsItems && newsItems.length > 0 ? (
                        newsItems.map((news) => (
                            <div key={news.id} className="group overflow-hidden flex flex-col rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                <div className="aspect-video relative overflow-hidden bg-slate-950/50 border-b border-slate-800 flex-shrink-0">
                                    {news.image_url ? (
                                        <img src={news.image_url} alt={news.title} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-slate-800/30">
                                            <Calendar className="w-12 h-12 text-slate-700" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            {new Date(news.published_at).toLocaleDateString()}
                                        </div>
                                        {news.profiles?.full_name && (
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-primary" />
                                                {news.profiles.full_name}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="font-outfit text-2xl font-black text-white leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
                                        {news.title}
                                    </h3>

                                    <p className="text-slate-400 text-sm font-medium line-clamp-3 mb-8 flex-1 leading-relaxed">
                                        {news.content}
                                    </p>

                                    <Link href={`/news/${news.id}`} className="mt-auto inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors group/link bg-slate-800/50 hover:bg-primary py-3 px-6 rounded-full self-start border border-slate-700 hover:border-primary">
                                        Read Full Story <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center rounded-[3rem] bg-slate-900/30 backdrop-blur-md border border-dashed border-slate-800 relative overflow-hidden flex flex-col items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50 pointer-events-none" />
                            <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-6 relative z-10">
                                <Calendar className="w-10 h-10 text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-black font-outfit uppercase tracking-tight text-slate-300 relative z-10">No news yet</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 relative z-10">Check back soon for exciting updates!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
