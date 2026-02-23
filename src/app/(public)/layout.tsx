import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-6 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="inline-block font-bold text-xl sm:text-2xl font-outfit bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                CompeteEdu
                            </span>
                        </Link>
                        <nav className="hidden md:flex gap-6">
                            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">About</Link>
                            <Link href="/competitions" className="text-sm font-medium transition-colors hover:text-primary">Competitions</Link>
                            <Link href="/news" className="text-sm font-medium transition-colors hover:text-primary">News</Link>
                            <Link href="/winners" className="text-sm font-medium transition-colors hover:text-primary">Winners</Link>
                            <Link href="/gallery" className="text-sm font-medium transition-colors hover:text-primary">Gallery</Link>
                            <Link href="/ranking" className="text-sm font-medium transition-colors hover:text-primary">Ranking</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Log in</Button>
                        </Link>
                        <Link href="/login?view=signup">
                            <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <footer className="border-t py-8 bg-muted/50">
                <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© 2026 CompeteEdu. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/contact" className="hover:text-primary">Contact</Link>
                        <Link href="/icon-story" className="hover:text-primary">Icon Story</Link>
                        <Link href="/teacher-awards" className="hover:text-primary">Teacher Awards</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
