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
        <div className="container py-20 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold font-outfit">Latest Updates</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Keep up with the latest announcements, winners, and stories from our vibrant student community.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {newsItems && newsItems.length > 0 ? (
                    newsItems.map((news) => (
                        <Card key={news.id} className="group overflow-hidden flex flex-col hover:shadow-lg transition-all border-0 bg-muted/30">
                            <div className="aspect-video relative overflow-hidden bg-muted">
                                {news.image_url ? (
                                    <img src={news.image_url} alt={news.title} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-primary/5">
                                        <Calendar className="w-12 h-12 text-primary/20" />
                                    </div>
                                )}
                            </div>
                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(news.published_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {news.profiles?.full_name}
                                    </div>
                                </div>
                                <CardTitle className="font-outfit text-2xl leading-tight line-clamp-2 underline-offset-4 group-hover:underline">
                                    {news.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-2 flex-1 flex flex-col">
                                <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                                    {news.content}
                                </p>
                                <Link href={`/news/${news.id}`} className="mt-auto text-primary font-bold text-sm flex items-center gap-2 group/link">
                                    Read Full Story <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center border rounded-3xl bg-muted/20">
                        <h3 className="text-xl font-bold font-outfit">No news yet</h3>
                        <p className="text-muted-foreground">Check back soon for exciting updates!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
