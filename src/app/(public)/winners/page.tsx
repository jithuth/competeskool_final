import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Medal, Users, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function WinnersPage() {
    const supabase = await createClient();

    // Fetch winners with profile and event details
    const { data: winners } = await supabase
        .from("winners")
        .select(`
            *,
            profiles:user_id (full_name, avatar_url, school:school_id (name)),
            events:event_id (title)
        `)
        .order("created_at", { ascending: false });

    return (
        <div className="bg-[#080B1A] min-h-screen pb-32 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-[20%] -left-[10%] w-[40%] aspect-square bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[20%] -right-[10%] w-[40%] aspect-square bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            {/* Gallery Header */}
            <section className="container mx-auto px-6 pt-24 mb-24 text-center space-y-8 relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-1 bg-primary" />
                </div>
                <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white leading-[0.85] mb-4 drop-shadow-sm">
                    Winners <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">Gallery</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed mt-6">
                    Celebrating the extraordinary achievements of our national student community. These individuals have set the standard for school-level excellence.
                </p>

                {/* Stats row for the wall */}
                <div className="flex justify-center gap-12 pt-8 border-t border-slate-800/60 mt-12">
                    <div className="text-center group cursor-default">
                        <div className="text-3xl font-black font-outfit text-white group-hover:text-primary transition-colors drop-shadow-sm">1.2k</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Total Laureates</div>
                    </div>
                    <div className="text-center group cursor-default">
                        <div className="text-3xl font-black font-outfit text-white group-hover:text-primary transition-colors drop-shadow-sm">25+</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Categories</div>
                    </div>
                    <div className="text-center group cursor-default">
                        <div className="text-3xl font-black font-outfit text-white group-hover:text-primary transition-colors drop-shadow-sm">45</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Indian States & UTs</div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-6 relative z-10">
                {winners && winners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {winners.map((winner: any) => (
                            <div key={winner.id} className="group relative">
                                {/* Elevated Card */}
                                <div className="bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-10 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-700 flex flex-col items-center text-center space-y-8 h-full shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10">

                                    {/* Winner Badge Icon */}
                                    <div className="w-32 h-32 relative group-hover:scale-110 transition-transform duration-700">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                        <div className="relative w-full h-full rounded-full border-4 border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner">
                                            {winner.profiles?.avatar_url ? (
                                                <Image src={winner.profiles.avatar_url} alt={winner.profiles.full_name} fill className="object-cover" />
                                            ) : (
                                                <Users className="w-12 h-12 text-slate-700" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)] border-2 border-slate-900 group-hover:scale-110 transition-transform">
                                            <Medal className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    {/* Rank & Title */}
                                    <div className="space-y-3 w-full">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                            <Trophy className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]" />
                                            <span>Rank #{winner.rank || 1} • {winner.category}</span>
                                        </div>
                                        <h3 className="text-3xl font-black font-outfit uppercase tracking-tight text-white group-hover:text-primary transition-colors leading-tight drop-shadow-sm">
                                            {winner.profiles?.full_name}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {winner.profiles?.school?.name || "Independent Candidate"}
                                        </p>
                                    </div>

                                    {/* Contest Detail */}
                                    <div className="w-full pt-6 border-t border-slate-800/60 mt-auto">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Competition</p>
                                        <Link href={`/competitions/${winner.event_id}`} className="text-sm font-black text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 group/link">
                                            {winner.events?.title}
                                            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center group-hover/link:bg-primary transition-colors">
                                                <ArrowUpRight className="w-3 h-3 group-hover/link:text-white" />
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Badge Preview (Hover only) - Assuming badge image is still used */}
                                    <div className="absolute -top-4 -right-4 w-24 h-24 rotate-12 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
                                        {/* Fallback to simple icon if image fails */}
                                        <div className="w-full h-full text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] flex items-center justify-center">
                                            <Trophy className="w-16 h-16" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-20 border border-slate-800 text-center space-y-8 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50 pointer-events-none" />
                        <div className="w-24 h-24 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-8 relative z-10">
                            <Star className="w-10 h-10 text-slate-500" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-4xl font-black font-outfit uppercase tracking-tight text-white drop-shadow-sm">The Gallery is Preparing</h2>
                            <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                                Our board of adjudicators is currently finalizing the results for the Spring 2026 Academic Season. New laureates will be announced shortly.
                            </p>
                        </div>
                        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <Link href="/competitions">
                                <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">View Current Seasons</Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-700 text-slate-300 bg-slate-800/30 hover:bg-slate-800 hover:text-white font-black uppercase tracking-widest text-[10px]">Student Login</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
