import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID } from "@/lib/appwrite/ssr";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft, Share2, Printer, Bookmark } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

interface NewsDetailProps {
    params: Promise<{ id: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
    const { id } = await params;
    const adminAppwrite = getAppwriteAdmin();

    let news: any = null;
    let authorProfile: any = null;

    try {
        news = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "news", id);
        if (news.created_by) {
            try {
                authorProfile = await adminAppwrite.databases.getDocument(APPWRITE_DATABASE_ID, "profiles", news.created_by);
            } catch (e) { }
        }
    } catch (e: any) {
        if (e.code === 404) notFound();
    }

    if (!news) notFound();

    return (
        <div className="bg-[#080B1A] min-h-screen py-32">
            <div className="container mx-auto px-6 relative max-w-5xl">
                {/* Back Link */}
                <Link href="/news" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors mb-12 relative z-10">
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Return to Intelligence Feed
                </Link>

                <div className="space-y-12 relative z-10">
                    {/* Header */}
                    <div className="space-y-8 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <Badge className="bg-primary/20 text-primary border-primary/30 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] self-center md:self-start">
                                Public Bulletin
                            </Badge>
                            <div className="flex gap-3 justify-center">
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white transition-all">
                                    <Share2 className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white transition-all">
                                    <Bookmark className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white transition-all">
                                    <Printer className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black font-outfit uppercase tracking-tighter text-white leading-[0.95] drop-shadow-2xl">
                            {news.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-xs text-slate-500 font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                                    {authorProfile?.avatar_url ? (
                                        <img src={authorProfile.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <User className="w-5 h-5 text-slate-500" />
                                    )}
                                </div>
                                <span>{authorProfile?.full_name || "Official Administrator"}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Calendar className="w-4 h-4 text-primary" />
                                {new Date(news.published_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Banner Image */}
                    {news.image_url && (
                        <div className="aspect-[21/9] rounded-[3rem] overflow-hidden border-4 border-slate-900 shadow-3xl shadow-primary/5 bg-slate-900/50 relative group">
                            <img src={news.image_url} alt="" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#080B1A]/80 via-transparent to-transparent pointer-events-none" />
                        </div>
                    )}

                    {/* Article Body */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[4rem] p-10 md:p-20 shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                        <article
                            className="prose prose-invert prose-slate max-w-none prose-headings:font-outfit prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-lg prose-strong:text-white prose-blockquote:border-primary prose-blockquote:bg-slate-950/50 prose-blockquote:rounded-2xl prose-blockquote:p-6 prose-blockquote:italic prose-img:rounded-[2.5rem] prose-img:border-4 prose-img:border-slate-800 prose-a:text-primary prose-a:no-underline hover:prose-a:underline font-medium"
                            dangerouslySetInnerHTML={{ __html: news.content }}
                        />
                    </div>

                    {/* Footer CTA */}
                    <div className="pt-20 border-t border-slate-800 flex flex-col items-center gap-8 text-center">
                        <div className="space-y-4 max-w-md mx-auto">
                            <h4 className="text-xl font-black font-outfit uppercase tracking-tight text-white">Join the Community</h4>
                            <p className="text-slate-400 font-medium">Be the first to know about new competitions and success stories by registering your institution today.</p>
                        </div>
                        <Link href="/login?view=signup">
                            <Button className="h-16 px-12 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95 group">
                                Participate Now <ArrowLeft className="w-5 h-5 ml-3 rotate-180 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
