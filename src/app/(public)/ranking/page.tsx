import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Star, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function RankingPage() {
    const supabase = await createClient();
    const { data: rankings } = await supabase
        .from("rankings")
        .select(`
      *,
      profiles (full_name, school_id, schools (name))
    `)
        .order("rank", { ascending: true })
        .limit(50);

    return (
        <div className="bg-[#080B1A] min-h-screen py-32">
            <div className="container mx-auto px-6 space-y-16 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="text-center space-y-6 relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-1.5 bg-primary" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white drop-shadow-sm">
                        Wall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">Fame</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                        Honoring the brightest minds and most talented students across all participating schools.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-end mt-20 relative z-10">
                    {rankings && rankings.slice(0, 3).map((rank, i) => (
                        <div key={rank.id} className={`flex flex-col items-center p-8 rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border border-slate-800 relative overflow-hidden group hover:border-slate-700 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 ${i === 0 ? 'md:order-2 h-[400px] shadow-2xl scale-110 z-10 bg-slate-900/60' :
                            i === 1 ? 'md:order-1 h-[340px]' : 'md:order-3 h-[320px]'
                            }`}>
                            <div className={`absolute top-0 inset-x-0 h-2 ${i === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.3)]' : 'bg-gradient-to-r from-amber-600 to-orange-500 shadow-[0_0_20px_rgba(217,119,6,0.5)]'
                                }`} />
                            <div className="relative mb-6 mt-4">
                                <Avatar className={`w-24 h-24 border-4 ${i === 0 ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : i === 1 ? 'border-slate-400' : 'border-amber-600'
                                    }`}>
                                    <AvatarFallback className="text-3xl font-black bg-slate-800 text-white">{rank.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-3 -right-3 bg-slate-900 rounded-full p-2.5 border border-slate-700 shadow-xl group-hover:scale-110 transition-transform">
                                    {i === 0 ? <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" /> : i === 1 ? <Medal className="w-6 h-6 text-slate-300" /> : <Award className="w-6 h-6 text-amber-500" />}
                                </div>
                            </div>
                            <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-white text-center line-clamp-1 mt-2">{rank.profiles?.full_name}</h3>
                            <p className="text-xs font-bold text-slate-400 text-center mb-6 uppercase tracking-widest">{rank.profiles?.schools?.name}</p>
                            <div className="mt-auto flex flex-col items-center bg-slate-950/50 w-full py-4 rounded-2xl border border-slate-800/50">
                                <div className="text-4xl font-black font-outfit text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">{rank.total_score}</div>
                                <div className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500 mt-1">Total Points</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border border-slate-800 overflow-hidden shadow-2xl relative z-10">
                    <Table>
                        <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableHead className="w-24 py-6 font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Rank</TableHead>
                                <TableHead className="py-6 font-black uppercase tracking-widest text-[10px] text-slate-400">Student Scholar</TableHead>
                                <TableHead className="py-6 font-black uppercase tracking-widest text-[10px] text-slate-400 hidden md:table-cell">Institution</TableHead>
                                <TableHead className="text-right py-6 font-black uppercase tracking-widest text-[10px] text-slate-400 pr-8">Total Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rankings && rankings.length > 0 ? (
                                rankings.map((rank, index) => (
                                    <TableRow key={rank.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                                        <TableCell className="font-black text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/50 text-slate-300 text-xs shadow-inner">#{rank.rank}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="w-10 h-10 border border-slate-700 shadow-md">
                                                    <AvatarFallback className="bg-slate-800 text-white font-bold text-xs">{rank.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-white group-hover:text-primary transition-colors">{rank.profiles?.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-400 font-medium text-sm hidden md:table-cell">{rank.profiles?.schools?.name}</TableCell>
                                        <TableCell className="text-right pr-8">
                                            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-black font-outfit text-sm border border-primary/20">
                                                {rank.total_score}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center border-0">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <Star className="w-8 h-8 text-slate-700 mb-2" />
                                            <span className="font-bold uppercase tracking-widest text-xs">Rankings Pending</span>
                                            <span className="text-sm">Scores are currently being tabulated.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
