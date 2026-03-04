"use client";

import { ExternalLink, Video, Music, FileText } from "lucide-react";

interface SubmissionVideo {
    type: string;
    youtube_url?: string | null;
    vimeo_url?: string | null;
    video_url?: string | null;
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        return u.searchParams.get("v")
            || u.pathname.split("/").pop()?.split("?")[0]
            || null;
    } catch {
        return null;
    }
}

export function extractVimeoId(url: string): string | null {
    try {
        // handles: https://vimeo.com/123456789  and  https://player.vimeo.com/video/123456789
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return match?.[1] || null;
    } catch {
        return null;
    }
}

/** Picks the best YouTube thumbnail URL (tries maxresdefault, falls back to mqdefault) */
export function youtubeThumbnail(ytId: string) {
    return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
}

// ─── Main player ──────────────────────────────────────────────────────────────

interface MediaPlayerProps {
    video: SubmissionVideo;
    className?: string;
    /** When true renders a compact card instead of the full iframe */
    compact?: boolean;
    poster?: string;
}

/**
 * Renders the correct player for upload / youtube / vimeo submissions.
 * - YouTube → native embed iframe
 * - Vimeo   → native embed iframe
 * - upload  → <video> tag (or audio/image fallback based on mime type)
 */
export function MediaPlayer({ video, className = "", compact = false, poster = "" }: MediaPlayerProps) {
    const base = `w-full ${className}`;

    if (video.type === "youtube" && video.youtube_url) {
        const ytId = extractYouTubeId(video.youtube_url);
        if (!ytId) return <MediaFallback url={video.youtube_url} label="YouTube" />;
        if (compact) return (
            <a href={video.youtube_url} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                <img src={youtubeThumbnail(ytId)} alt="YouTube" className="w-24 h-14 object-cover rounded-lg shrink-0" />
                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-600">YouTube Video</p>
                    <p className="text-xs text-slate-500 font-medium truncate">{video.youtube_url}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-red-400 shrink-0 ml-auto" />
            </a>
        );
        return (
            <div className={`aspect-video rounded-2xl overflow-hidden ${base}`}>
                <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="YouTube submission"
                />
            </div>
        );
    }

    if (video.type === "vimeo" && video.vimeo_url) {
        const vimeoId = extractVimeoId(video.vimeo_url);
        if (!vimeoId) return <MediaFallback url={video.vimeo_url} label="Vimeo" />;
        if (compact) return (
            <a href={video.vimeo_url} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-sky-50 border border-sky-100 hover:bg-sky-100 transition-colors">
                <div className="w-24 h-14 rounded-lg bg-sky-200 flex items-center justify-center shrink-0">
                    <span className="text-sky-700 font-black text-[10px] uppercase">Vimeo</span>
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-sky-600">Vimeo Video</p>
                    <p className="text-xs text-slate-500 font-medium truncate">{video.vimeo_url}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-sky-400 shrink-0 ml-auto" />
            </a>
        );
        return (
            <div className={`aspect-video rounded-2xl overflow-hidden ${base}`}>
                <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    title="Vimeo submission"
                />
            </div>
        );
    }

    if ((video.type === "upload" || video.video_url) && video.video_url) {
        const isAudio = video.video_url.match(/\.(mp3|ogg|wav|flac|aac|m4a|weba)(?:[?&]|$)/i);
        const isImage = video.video_url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(?:[?&]|$)/i);
        const isPDF = video.video_url.match(/\.pdf(?:[?&]|$)/i);

        if (isPDF) return (
            <div className={`rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 ${base}`} style={{ height: "600px" }}>
                <iframe
                    src={`${video.video_url}#toolbar=0`}
                    className="w-full h-full"
                    title="PDF Submission"
                />
            </div>
        );

        if (isImage) return (
            <div className={`rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center group/img relative ${base}`}>
                <img src={video.video_url} alt="Submission" className="max-w-full max-h-[500px] object-contain transition-transform duration-500 group-hover/img:scale-105 relative z-10" />
                {poster && (
                    <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors pointer-events-none z-20" />
            </div>
        );

        if (isAudio) return (
            <div className={`p-8 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-[2rem] border-2 border-indigo-100/50 flex flex-col items-center gap-6 ${base}`}>
                <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-indigo-600 animate-pulse">
                    <Music className="w-10 h-10" />
                </div>
                <div className="w-full space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] text-center">Audio Frequency Detected</p>
                    <audio controls className="w-full">
                        <source src={video.video_url} />
                    </audio>
                </div>
            </div>
        );

        return (
            <div className={`aspect-video rounded-2xl overflow-hidden bg-black ${base}`}>
                <video controls className="w-full h-full object-contain" poster={poster}>
                    <source src={video.video_url} />
                </video>
            </div>
        );
    }

    return <MediaFallback url={null} label="Media" />;
}

function MediaFallback({ url, label }: { url: string | null; label: string }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Video className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:underline truncate block">
                        {url}
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Thumbnail-only helper (for gallery views) ─────────────────────────────

interface MediaThumbnailProps {
    video?: SubmissionVideo;
    className?: string;
}

export function MediaThumbnail({ video, className = "" }: MediaThumbnailProps) {
    if (!video) return <PlaceholderThumb className={className} />;

    if (video.type === "youtube" && video.youtube_url) {
        const ytId = extractYouTubeId(video.youtube_url);
        if (ytId) return (
            <img
                src={youtubeThumbnail(ytId)}
                alt="YouTube Thumbnail"
                className={`object-cover w-full h-full ${className}`}
            />
        );
    }

    if (video.type === "vimeo" && video.vimeo_url) {
        return (
            <div className={`flex items-center justify-center bg-sky-900 ${className}`}>
                <span className="text-white font-black text-xs uppercase tracking-widest opacity-50">Vimeo</span>
            </div>
        );
    }

    return <PlaceholderThumb className={className} />;
}

function PlaceholderThumb({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center bg-slate-800 ${className}`}>
            <Video className="w-8 h-8 text-slate-600" />
        </div>
    );
}
