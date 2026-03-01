import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden animate-in fade-in duration-700">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-100 rounded-bl-[100%] blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-rose-100 rounded-tr-[100%] blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />

            <div className="max-w-md w-full relative z-10 text-center space-y-8 p-10 bg-white/80 backdrop-blur-xl rounded-[3rem] border border-slate-100 shadow-2xl shadow-indigo-100/50">

                {/* Animated Icon */}
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-50 duration-1000"></div>
                    <div className="absolute inset-0 bg-indigo-50 rounded-full animate-pulse opacity-80 duration-700"></div>
                    <div className="relative z-10 w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200 rotate-12 flex items-center justify-center transition-transform hover:rotate-0 hover:scale-110 duration-300">
                        <AlertCircle className="w-10 h-10 text-white" />
                    </div>
                    {/* Floating 404 text blocks */}
                    <span className="absolute -top-2 -left-4 text-7xl font-black font-outfit text-indigo-900/10 -rotate-12 select-none">4</span>
                    <span className="absolute -bottom-4 right-0 text-8xl font-black font-outfit text-indigo-900/10 rotate-12 select-none">0</span>
                    <span className="absolute top-10 -right-8 text-6xl font-black font-outfit text-indigo-900/10 -rotate-6 select-none">4</span>
                </div>

                {/* Text Content */}
                <div className="space-y-4 pt-4">
                    <h1 className="text-4xl font-black text-slate-900 font-outfit tracking-tight">
                        Lost <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500 italic">Page</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                        Oops! It seems you've ventured into uncharted territory. The page you're looking for was moved, removed, or never existed.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <Link href="/">
                        <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20 group w-full sm:w-auto">
                            <Home className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                            Go Back Home
                        </Button>
                    </Link>
                    <Link href="/competitions">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 font-bold tracking-wide transition-all hover:scale-105 active:scale-95 group w-full sm:w-auto">
                            <Search className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-indigo-500" />
                            Explore Events
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
