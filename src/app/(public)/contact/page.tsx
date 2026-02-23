export default function ContactPage() {
    return (
        <div className="bg-[#080B1A] min-h-screen py-32">
            <div className="container mx-auto px-6 text-center space-y-12 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-1 bg-primary" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black font-outfit uppercase tracking-tighter text-white drop-shadow-sm">
                        Contact Us
                    </h1>
                    <p className="text-slate-400 font-medium text-lg mx-auto max-w-lg leading-relaxed">
                        Have questions about a competition or need technical support? We're here to help.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left py-12 relative z-10">
                    <div className="bg-slate-900/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300 space-y-4 shadow-xl shadow-primary/5 group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        </div>
                        <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-white">Email Support</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">Our team typically responds within 24 hours.</p>
                        <p className="font-bold text-primary mt-2">support@competeedu.com</p>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300 space-y-4 shadow-xl shadow-primary/5 group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-white">School Partnerships</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">Register your school for the next events.</p>
                        <p className="font-bold text-primary mt-2">partners@competeedu.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
