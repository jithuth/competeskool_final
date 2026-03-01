import { Construction, GraduationCap } from "lucide-react";

export default function TeacherAwardsPage() {
    return (
        <div className="bg-[#080B1A] min-h-screen pb-32 flex items-center justify-center">
            <div className="container mx-auto px-6 pt-24 text-center space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-primary/10">
                        <GraduationCap className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white leading-[0.85] drop-shadow-sm">
                        Educator <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">Awards</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed mt-8">
                        Behind every brilliant student is an inspiring educator. We're developing a unified dashboard to recognize the outstanding teachers curating excellence in India's leading institutions.
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/50 px-6 py-3 rounded-full border border-slate-800 backdrop-blur-sm">
                        <Construction className="w-4 h-4 text-primary" /> Architecture Under Review
                    </div>
                </div>
            </div>
        </div>
    );
}
