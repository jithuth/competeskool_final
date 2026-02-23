import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Star } from "lucide-react";
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
        <div className="container py-20 space-y-16">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold font-outfit">Wall of Fame</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Honoring the brightest minds and most talented students across all participating schools.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto items-end">
                {rankings && rankings.slice(0, 3).map((rank, i) => (
                    <div key={rank.id} className={`flex flex-col items-center p-8 rounded-3xl border bg-card relative overflow-hidden group hover:border-primary transition-all ${i === 0 ? 'md:order-2 h-[350px] shadow-2xl scale-110' :
                            i === 1 ? 'md:order-1 h-[300px]' : 'md:order-3 h-[280px]'
                        }`}>
                        <div className={`absolute top-0 inset-x-0 h-2 ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : 'bg-amber-600'
                            }`} />
                        <div className="relative mb-6">
                            <Avatar className={`w-20 h-20 border-4 ${i === 0 ? 'border-yellow-400' : i === 1 ? 'border-slate-400' : 'border-amber-600'
                                }`}>
                                <AvatarFallback className="text-2xl font-bold">{rank.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-2 border">
                                {i === 0 ? <Trophy className="w-6 h-6 text-yellow-500" /> : <Medal className="w-6 h-6 text-muted-foreground" />}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center line-clamp-1">{rank.profiles?.full_name}</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">{rank.profiles?.schools?.name}</p>
                        <div className="mt-auto flex flex-col items-center">
                            <div className="text-3xl font-bold font-outfit text-primary">{rank.total_score}</div>
                            <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Points</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto border rounded-3xl bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-20">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead className="text-right">Total Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rankings && rankings.length > 0 ? (
                            rankings.map((rank) => (
                                <TableRow key={rank.id}>
                                    <TableCell className="font-bold">#{rank.rank}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback>{rank.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{rank.profiles?.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{rank.profiles?.schools?.name}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{rank.total_score}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Rankings are not available yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
