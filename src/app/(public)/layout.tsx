import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { getSiteSettings, getSeoConfig } from "@/lib/cms";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getSeoConfig("/");
    if (!seo) return { title: "CompeteEdu India" };

    return {
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        openGraph: {
            images: seo.og_image_url ? [seo.og_image_url] : [],
        },
    };
}

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getSiteSettings();
    const contactEmail = settings?.contact_email || "contact@competeedu.com";
    const footerCopy = settings?.footer_copy || "© 2026 CompeteEdu India. All Rights Reserved.";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let role = null;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        role = profile?.role;
    }

    const siteTitle = settings?.site_title || "CompeteEdu";
    const siteLogo = settings?.site_logo;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Centered Header */}
            <header className="w-full border-b bg-white/95 backdrop-blur-md border-slate-200 relative z-50 shadow-sm">
                <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand Logo */}
                    <Link href="/" className="group flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform overflow-hidden ${siteLogo ? 'bg-transparent p-0.5' : 'bg-slate-900 shadow-lg p-1'}`}>
                            {siteLogo ? (
                                <img src={siteLogo} alt="Logo" className="w-full h-full object-contain rounded-2xl" />
                            ) : (
                                <GraduationCap className="w-7 h-7 text-white" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black font-outfit uppercase tracking-[0.2em] text-slate-900 leading-none">
                                {siteTitle}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mt-1">
                                Excellence in Education
                            </span>
                        </div>
                    </Link>
                    {/* ... nav remains the same ... */}

                    {/* Centered Navigation */}
                    <nav className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
                        {[
                            { name: "About", href: "/about" },
                            { name: "Competitions", href: "/competitions" },
                            { name: "News", href: "/news" },
                            { name: "Winners", href: "/winners" },
                            { name: "Gallery", href: "/gallery" },
                            { name: "Ranking", href: "/ranking" },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600 hover:text-primary transition-colors relative group"
                            >
                                {item.name}
                                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        {user ? (
                            <>
                                <form action={async () => {
                                    'use server';
                                    const { createClient } = await import('@/lib/supabase/server');
                                    const supabase = await createClient();
                                    await supabase.auth.signOut();
                                    redirect("/");
                                }}>
                                    <Button type="submit" variant="ghost" size="sm" className="font-black uppercase tracking-widest text-[10px] h-10 px-4 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                        Log out
                                    </Button>
                                </form>
                                <Link href="/dashboard">
                                    <Button size="sm" className="bg-primary text-white font-black uppercase tracking-[0.15em] text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                        {role ? `${role.replace('_', ' ')} Dashboard` : 'Dashboard'}
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="font-black uppercase tracking-widest text-[10px] h-10 px-4 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href="/login?view=signup">
                                    <Button size="sm" className="bg-primary text-white font-black uppercase tracking-[0.15em] text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                        Participate
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            {/* Premium Light Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 py-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                        {/* Branding Col */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${siteLogo ? 'bg-transparent' : 'bg-slate-900 p-1'}`}>
                                    {siteLogo ? (
                                        <img src={siteLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                                    ) : (
                                        <GraduationCap className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <span className="text-xl font-black font-outfit uppercase tracking-widest text-slate-900">
                                    {siteTitle}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                India&apos;s premier platform for fostering academic excellence and competitive spirit in schools nationwide.
                            </p>
                            <div className="flex gap-4">
                                <Link href="#" className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 hover:text-primary hover:border-slate-300 transition-colors"><Twitter className="w-4 h-4" /></Link>
                                <Link href="#" className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 hover:text-primary hover:border-slate-300 transition-colors"><Linkedin className="w-4 h-4" /></Link>
                                <Link href="#" className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 hover:text-primary hover:border-slate-300 transition-colors"><Github className="w-4 h-4" /></Link>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Institutional</h4>
                            <ul className="space-y-3">
                                {["About Organization", "Register School", "Institutional Gallery", "Teacher Recognition", "Success Stories"].map(l => (
                                    <li key={l}><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">{l}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Resources</h4>
                            <ul className="space-y-3">
                                {["Competition Rules", "Media Guidelines", "Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
                                    <li key={l}><Link href="#" className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">{l}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Get in Touch</h4>
                            <div className="space-y-4">
                                <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-slate-500 hover:text-primary transition-colors group">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">{contactEmail}</span>
                                </a>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                                    Our support team responds during institutional hours (GMT+1).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {footerCopy}
                        </p>
                        <div className="flex gap-8">
                            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Safety</Link>
                            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Diversity</Link>
                            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Accessibility</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
