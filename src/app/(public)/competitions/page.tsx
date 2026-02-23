import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import Link from "next/link";

export default async function CompetitionsPage() {
    const supabase = await createClient();
    const { data: events } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false });

    return (
        <div className="container py-20 space-y-12">
            <div className="space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-bold font-outfit">Active Competitions</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Explore our ongoing and upcoming challenges. Showcase your talent and win amazing prizes.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events && events.length > 0 ? (
                    events.map((event) => (
                        <Card key={event.id} className="overflow-hidden group hover:border-primary transition-colors">
                            <div className="aspect-video relative overflow-hidden bg-muted">
                                {event.banner_url ? (
                                    <img src={event.banner_url} alt={event.title} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Trophy className="w-12 h-12 text-muted-foreground/20" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <Badge className={event.status === 'active' ? 'bg-green-500' : 'bg-blue-500'}>
                                        {event.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="font-outfit text-2xl">{event.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-4">
                                <Button className="flex-1" asChild>
                                    <Link href={`/competitions/${event.id}`}>View Full Details</Link>
                                </Button>
                                <Button variant="outline" className="flex-1" asChild>
                                    <Link href={`/register-school`}>Join Platform</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 border rounded-3xl bg-muted/20">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold">No active competitions</h3>
                        <p className="text-muted-foreground">Check back later for new events!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
