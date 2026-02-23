import { Button } from "@/components/ui/button";
import { Star, Shield, Zap, Heart, Globe, Award, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getSeoConfig, getSiteSettings } from "@/lib/cms";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getSeoConfig("/about");
    if (!seo) return { title: "About Us | CompeteEdu India" };
    return { title: seo.title, description: seo.description };
}

export default async function AboutPage() {
    const settings = await getSiteSettings();
    const siteTitle = settings?.site_title || "CompeteEdu";

    return (
        <div className="flex flex-col gap-32 pb-32 bg-[#080B1A]">
            {/* Editorial Mission Statement */}
            <section className="container mx-auto px-6 pt-32 text-center space-y-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-1.5 bg-primary" />
                    </div>
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Badge variant="outline" className="px-6 py-1 rounded-full border-slate-700 bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 backdrop-blur-sm">Our Manifest</Badge>
                        <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white leading-[0.85] drop-shadow-sm">
                            Architecture of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">Indian Talent</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto drop-shadow-sm">
                            {siteTitle} was established as a national educational platform dedicated to the discovery and promotion of student excellence. We provide a transparent framework for students to showcase their mastery on a national stage.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12">
                        <Link href="/login?view=signup">
                            <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Institutional Access</Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-slate-700 text-slate-300 bg-slate-800/20 hover:bg-slate-800 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">National Inquiries</Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Visual Block / Institutional Values */}
            <section className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { title: "Excellence", desc: "Setting national benchmarks for student performance and school achievement.", icon: Star },
                        { title: "Transparency", desc: "A robust, verified scoring system that ensures complete fairness across all competition categories.", icon: Shield },
                        { title: "Inclusivity", desc: "Removing geographic barriers to discovery, allowing students from every corner of India to participate.", icon: Globe },
                        { title: "Recognition", desc: "Providing nationwide visibility through our Winners Gallery and verified electronic certification.", icon: Award },
                    ].map((item, i) => (
                        <div key={i} className="group p-10 rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:bg-slate-900/60 hover:border-slate-700 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-primary transition-all group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20">
                                <item.icon className="w-8 h-8" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-white group-hover:text-primary transition-colors">{item.title}</h3>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* History / Methodology Section */}
            <section className="bg-[#050711] py-32 text-white overflow-hidden relative border-y border-slate-800/50">
                <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none mix-blend-screen">
                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                </div>

                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="w-12 h-1 bg-primary" />
                        <h2 className="text-4xl md:text-6xl font-black font-outfit uppercase tracking-tighter leading-[0.9] drop-shadow-md">
                            Our Methodology <br />
                            <span className="text-slate-500 font-medium italic">Curated Excellence</span>
                        </h2>
                        <div className="space-y-6 text-slate-400 font-medium text-lg leading-relaxed">
                            <p>
                                At CompeteEdu, we don't just host competitions; we curate experiences. Every category is designed by a board of national experts to challenge student creativity and technical mastery.
                            </p>
                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-800/60">
                                <div>
                                    <div className="text-4xl font-black font-outfit text-white drop-shadow-sm">45+</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Certified Judges</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-black font-outfit text-white drop-shadow-sm">250+</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Member Schools</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <div className="bg-slate-900/60 backdrop-blur-md rounded-[3rem] p-12 border border-slate-800 shadow-xl space-y-12 relative overflow-hidden transition-all duration-700 group-hover:border-slate-700">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="space-y-4 relative z-10">
                                <Users className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                <h3 className="text-2xl font-black font-outfit uppercase tracking-tight text-white mt-4">Institutional Synergy</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Our platform acts as a bridge between academic institutions and leading industry experts, ensuring that student achievement translates to real-world opportunities.
                                </p>
                            </div>
                            <div className="aspect-video rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center relative z-10 shadow-inner">
                                <Zap className="w-12 h-12 text-slate-700" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
