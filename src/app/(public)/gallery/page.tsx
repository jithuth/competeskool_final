import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Maximize2 } from "lucide-react";

export default async function GalleryPage() {
    const supabase = await createClient();
    const { data: galleryItems } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="bg-[#080B1A] min-h-screen pb-32">
            {/* Gallery Header */}
            <div className="container mx-auto px-6 pt-24 mb-20 text-center space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-1.5 bg-primary" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-white leading-[0.85] drop-shadow-sm">
                        Visual <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 italic">Archives</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed mt-8">
                        A curated collection of defining moments, student breakthroughs, and the artistic spirit of our national institutional community.
                    </p>

                    <div className="flex justify-center gap-4 pt-10 flex-wrap">
                        {["All Media", "Grand Finals", "Student Works", "Award Ceremonies"].map(f => (
                            <button key={f} className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full border border-slate-700 bg-slate-800/30 text-slate-300 hover:border-primary hover:text-white hover:bg-slate-800/80 transition-all backdrop-blur-sm">
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                    {galleryItems && galleryItems.length > 0 ? (
                        galleryItems.map((item) => (
                            <div key={item.id} className="break-inside-avoid relative group rounded-[2.5rem] overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-slate-600 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 cursor-zoom-in">
                                <img
                                    src={item.image_url}
                                    alt={item.title || "Gallery Item"}
                                    className="w-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10 text-white">
                                    <div className="space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-primary hover:bg-primary border-0 rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                {item.category}
                                            </Badge>
                                            <Maximize2 className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black font-outfit uppercase tracking-tight leading-tight drop-shadow-md">
                                                {item.title}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                                Institutional Archive • 2026
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-slate-900/30 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-800 max-w-4xl mx-auto flex flex-col items-center gap-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50 pointer-events-none" />
                            <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center relative z-10">
                                <ImageIcon className="w-10 h-10 text-slate-500" />
                            </div>
                            <div className="space-y-3 relative z-10">
                                <h3 className="text-2xl font-black font-outfit uppercase tracking-tight text-slate-300">Institutional records pending</h3>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The visual archives for this season are currently being indexed.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
