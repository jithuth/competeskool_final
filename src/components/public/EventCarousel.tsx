"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Event {
    id: string;
    title: string;
    description: string | null;
    banner_url: string | null;
    end_date: string;
    media_type: string | null;
    is_private: boolean;
}

interface EventCarouselProps {
    events: Event[];
    fallbackImage: string;
}

export default function EventCarousel({ events, fallbackImage }: EventCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    const next = useCallback(() => {
        setCurrent((prev) => (prev + 1) % events.length);
    }, [events.length]);

    const prev = () => {
        setCurrent((prev) => (prev - 1 + events.length) % events.length);
    };

    useEffect(() => {
        if (paused || events.length <= 1) return;
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [paused, next, events.length]);

    if (!events.length) return null;

    const event = events[current];
    const image = event.banner_url || fallbackImage;

    return (
        <div
            className="relative rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px] bg-white"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Background image */}
            <div className="absolute inset-0 transition-all duration-700">
                <img
                    src={image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-white/20" />
            </div>

            {/* Badge */}
            <div className="absolute top-8 left-8 z-20">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Registration Open</span>
                </div>
            </div>

            {/* Prev / Next arrows */}
            {events.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 border border-slate-200 shadow-md flex items-center justify-center hover:bg-white transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 border border-slate-200 shadow-md flex items-center justify-center hover:bg-white transition-all"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                    </button>
                </>
            )}

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20">
                <div className="max-w-xl space-y-5 pt-16">
                    {/* Deadline badge */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Closes {format(new Date(event.end_date), "dd MMM yyyy")}
                        {event.media_type && ` · ${event.media_type} submission`}
                    </span>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-outfit text-slate-900 uppercase leading-[0.95] tracking-tighter drop-shadow-sm">
                        {event.title}
                    </h1>

                    {event.description && (
                        <div
                            className="prose-carousel text-base text-slate-700 font-medium leading-relaxed line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                    )}

                    <div className="pt-2">
                        <Link href={`/competitions/${event.id}`}>
                            <Button className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 group/btn">
                                Participate
                                <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dot indicators */}
            {events.length > 1 && (
                <div className="absolute right-12 bottom-12 z-30 flex gap-2.5 items-center">
                    {events.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-1.5 rounded-full transition-all shadow-sm ${i === current ? "w-10 bg-primary" : "w-4 bg-primary/20 hover:bg-primary/40"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
