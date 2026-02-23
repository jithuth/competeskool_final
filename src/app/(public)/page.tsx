import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveRight, Star, Trophy, Users, Video } from "lucide-react";

export default function HomePage() {
    return (
        <div className="flex flex-col gap-20 pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-10 md:pt-32 md:pb-20">
                <div className="container relative z-10">
                    <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-500">
                            <Star className="w-4 h-4 fill-primary" />
                            <span>Next Generation Excellence</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-bold tracking-tight font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Unleash Talent Across <br />
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Every School
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-1000">
                            The ultimate platform for school competitions, student showcases, and academic excellence. Join thousands of students and teachers today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            <Link href="/login?view=signup">
                                <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                                    Register Now <MoveRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/competitions">
                                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                                    View Competitions
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -z-10" />
            </section>

            {/* Stats Section */}
            <section className="container">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 border rounded-3xl bg-card/50 backdrop-blur-sm">
                    {[
                        { label: "Active Students", value: "10k+", icon: Users },
                        { label: "Participating Schools", value: "250+", icon: Star },
                        { label: "Total Submissions", value: "50k+", icon: Video },
                        { label: "Awards Won", value: "1.2k", icon: Trophy },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 text-center">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold font-outfit">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="container space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold font-outfit">Built for the Future</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Our platform provides everything you need to manage, participate, and judge school competitions at scale.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Seamless Submissions",
                            description: "Upload videos up to 50MB directly or link from YouTube. We handle the compression and streaming.",
                            icon: Video,
                        },
                        {
                            title: "Fair Judging",
                            description: "Expert judges use our specialized dashboard to score and provide feedback to every student.",
                            icon: Star,
                        },
                        {
                            title: "Real-time Rankings",
                            description: "Track performance with dynamic leaderboards and school-wide rankings updated instantly.",
                            icon: Trophy,
                        },
                    ].map((feature, i) => (
                        <div key={i} className="group p-8 border rounded-3xl bg-card hover:bg-muted/50 transition-all duration-300">
                            <div className="mb-6 p-4 w-fit rounded-2xl bg-muted group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                <feature.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 font-outfit">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="container">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-purple-900 px-8 py-20 text-white text-center">
                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight">
                            Ready to showcase your talent?
                        </h2>
                        <p className="text-primary-foreground/80 text-lg">
                            Join the most prestigious school competition platform and start your journey towards excellence.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/login?view=signup">
                                <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-12 px-8">
                                    Get Started for Free
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white h-12 px-8">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-110" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                </div>
            </section>
        </div>
    );
}
