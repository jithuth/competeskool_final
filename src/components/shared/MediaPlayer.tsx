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
}

/**
 * Renders the correct player for upload / youtube / vimeo submissions.
 * - YouTube → native embed iframe
 * - Vimeo   → native embed iframe
 * - upload  → <video> tag (or audio/image fallback based on mime type)
 */
export function MediaPlayer({ video, className = "", compact = false }: MediaPlayerProps) {
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
        const isAudio = video.video_url.match(/\.(mp3|ogg|wav|flac|aac|m4a)(\?|$)/i);
        const isImage = video.video_url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i);

        if (isImage) return (
            <img src={video.video_url} alt="Submission" className={`rounded-2xl object-contain max-h-96 ${base}`} />
        );
        if (isAudio) return (
            <div className={`p-4 bg-slate-50 rounded-2xl ${base}`}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Audio Submission</p>
                <audio controls className="w-full">
                    <source src={video.video_url} />
                </audio>
            </div>
        );
        return (
            <video controls className={`rounded-2xl max-h-80 ${base}`}>
                <source src={video.video_url} />
            </video>
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
