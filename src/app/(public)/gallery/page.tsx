import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function GalleryPage() {
    const supabase = await createClient();
    const { data: galleryItems } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="container py-20 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold font-outfit text-gradient">Visual Showcase</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    A glimpse into the incredible work and memorable moments from our competitions.
                </p>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {galleryItems && galleryItems.length > 0 ? (
                    galleryItems.map((item) => (
                        <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all">
                            <img
                                src={item.image_url}
                                alt={item.title || "Gallery Item"}
                                className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                                <Badge className="w-fit mb-2 bg-white/20 backdrop-blur-md border-0">{item.category}</Badge>
                                <h3 className="text-lg font-bold font-outfit">{item.title}</h3>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl col-span-3">
                        <h3 className="text-xl font-bold">The gallery is being curated</h3>
                        <p className="text-muted-foreground">Photos from recent events will appear here soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
