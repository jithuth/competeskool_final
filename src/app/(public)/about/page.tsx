import { Button } from "@/components/ui/button";
import { Star, Shield, Zap, Heart } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="flex flex-col gap-24 pb-24">
            <section className="container pt-20">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/20 text-primary">Our Mission</Badge>
                        <h1 className="text-4xl md:text-6xl font-bold font-outfit leading-tight">
                            Empowering Students to Reach Their <span className="text-primary italic">Full Potential</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            CompeteEdu was founded on the belief that every student has a unique talent waiting to be discovered. Our platform provides the stage, the tools, and the community to help students showcase their excellence on a global scale.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/competitions">
                                <Button size="lg" className="h-12 px-8">Explore Events</Button>
                            </Link>
                            <Link href="/contact">
                                <Button size="lg" variant="outline" className="h-12 px-8">Talk to Us</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-[2rem] overflow-hidden aspect-[4/5] bg-muted relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Star className="w-32 h-32 text-primary/10" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-muted/50 py-24">
                <div className="container">
                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                        {[
                            {
                                title: "Excellence",
                                desc: "We strive for the highest standards in everything we do.",
                                icon: Star
                            },
                            {
                                title: "Integrity",
                                desc: "Fairness and transparency are at the core of our judging system.",
                                icon: Shield
                            },
                            {
                                title: "Innovation",
                                desc: "We use technology to simplify complex competition workflows.",
                                icon: Zap
                            },
                            {
                                title: "Community",
                                desc: "We foster a supportive environment for students, teachers, and parents.",
                                icon: Heart
                            },
                        ].map((value, i) => (
                            <div key={i} className="flex gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <value.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-outfit mb-2">{value.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </span>
    );
}
