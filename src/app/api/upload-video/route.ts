import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, readFile, unlink, stat } from "fs/promises";
import { randomUUID } from "crypto";
import { uploadToYouTube, isYouTubeConfigured } from "@/lib/youtube";
import Busboy from "busboy";
import { IncomingMessage } from "http";

ffmpeg.setFfmpegPath(ffmpegPath.path);

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;        // 500 MB hard cap
const SKIP_COMPRESSION_THRESHOLD = 15 * 1024 * 1024; // skip ffmpeg if < 15 MB

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min

// ─── helpers ────────────────────────────────────────────────────────────────

function adminSupabase() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function compressToMp4(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .outputOptions([
                "-vcodec libx264",
                "-crf 26",
                "-preset fast",
                "-vf scale='min(1280,iw)':-2",
                "-maxrate 1.5M",
                "-bufsize 3M",
                "-acodec aac",
                "-b:a 128k",
                "-movflags +faststart",
                "-y",
            ])
            .output(output)
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .run();
    });
}

/**
 * Parse multipart/form-data using Busboy.
 * bodySizeLimit in next.config.ts raises the cap for req.arrayBuffer() on both
 * server actions AND route handlers — so this reliably handles up to 500 MB.
 */
function parseMultipart(req: NextRequest): Promise<{
    fields: Record<string, string>;
    file: { filename: string; mimetype: string; data: Buffer } | null;
}> {
    return new Promise((resolve, reject) => {
        const contentType = req.headers.get("content-type") || "";

        if (!contentType.includes("multipart/form-data")) {
            reject(new Error("Expected multipart/form-data"));
            return;
        }

        const bb = Busboy({
            headers: { "content-type": contentType },
            limits: { fileSize: MAX_UPLOAD_BYTES },
        });

        const fields: Record<string, string> = {};
        let file: { filename: string; mimetype: string; data: Buffer } | null = null;

        bb.on("field", (name, value) => { fields[name] = value; });

        bb.on("file", (name, stream, info) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => {
                if (name === "file") {
                    file = { filename: info.filename, mimetype: info.mimeType, data: Buffer.concat(chunks) };
                }
            });
            stream.on("error", reject);
        });

        bb.on("finish", () => resolve({ fields, file }));
        bb.on("error", (err) => reject(err));

        // req.arrayBuffer() works here because next.config.ts sets
        // experimental.serverActions.bodySizeLimit = "500mb" which governs
        // route handlers in Next.js 15/16.
        req.arrayBuffer()
            .then((buf) => {
                const { Readable } = require("stream") as typeof import("stream");
                Readable.from(Buffer.from(buf)).pipe(bb);
            })
            .catch(reject);
    });
}

// ─── POST /api/upload-video ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Parse multipart with Busboy (bypasses Next.js 10 MB limit)
    let parsed: Awaited<ReturnType<typeof parseMultipart>>;
    try {
        parsed = await parseMultipart(req);
    } catch (err: any) {
        console.error("[upload-video] Multipart parse error:", err.message);
        return NextResponse.json({ error: "Failed to parse upload: " + err.message }, { status: 400 });
    }

    const { fields, file } = parsed;
    if (!file || !file.data || file.data.length === 0) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.data.length > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
            { error: `File too large. Maximum: ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` },
            { status: 413 }
        );
    }

    const submissionTitle = fields.title || file.filename || "Submission";
    const submissionDescription = fields.description || "";

    const isVideo = file.mimetype.startsWith("video/");
    const id = randomUUID();
    const ext = file.filename.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "bin");
    const inputPath = join(tmpdir(), `${id}-input.${ext}`);
    const outputPath = join(tmpdir(), `${id}-output.mp4`);

    try {
        // 3. Write incoming bytes to tmp disk
        await writeFile(inputPath, file.data);

        let finalPath = inputPath;
        let finalMime = file.mimetype;
        let finalExt = ext;
        let compressed = false;
        const originalSizeMb = (file.data.length / 1024 / 1024).toFixed(2);
        let finalSizeMb = originalSizeMb;
        let savings = "0%";

        // 4. Compress video if needed
        if (isVideo && file.data.length > SKIP_COMPRESSION_THRESHOLD) {
            try {
                await compressToMp4(inputPath, outputPath);
                const compressedStat = await stat(outputPath);
                const originalStat = await stat(inputPath);
                if (compressedStat.size < originalStat.size) {
                    finalPath = outputPath;
                    finalMime = "video/mp4";
                    finalExt = "mp4";
                    compressed = true;
                    finalSizeMb = (compressedStat.size / 1024 / 1024).toFixed(2);
                    savings = `${Math.round((1 - compressedStat.size / originalStat.size) * 100)}%`;
                }
            } catch (comprErr: any) {
                console.error("[upload-video] Compression error, using original:", comprErr.message);
            }
        }

        // 5. Try YouTube upload for video files
        if (isVideo && isYouTubeConfigured()) {
            try {
                const ytResult = await uploadToYouTube(finalPath, submissionTitle, submissionDescription);
                return NextResponse.json({
                    success: true,
                    youtubeId: ytResult.videoId,
                    youtubeUrl: ytResult.url,
                    embedUrl: ytResult.embedUrl,
                    storageType: "youtube",
                    originalSizeMb,
                    finalSizeMb,
                    compressed,
                    savings,
                });
            } catch (ytErr: any) {
                console.error("[upload-video] YouTube upload failed, falling back to Supabase:", ytErr.message);
            }
        }

        // 6. Supabase Storage fallback (or primary for audio / image / document)
        const finalBuffer = await readFile(finalPath);
        const storagePath = `${user.id}/${id}.${finalExt}`;

        const supa = adminSupabase();
        const { error: uploadError } = await supa.storage
            .from("submissions")
            .upload(storagePath, finalBuffer, { contentType: finalMime, upsert: false });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supa.storage.from("submissions").getPublicUrl(storagePath);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: storagePath,
            storageType: "supabase",
            originalSizeMb,
            finalSizeMb,
            compressed,
            savings,
        });
    } finally {
        await unlink(inputPath).catch(() => { });
        await unlink(outputPath).catch(() => { });
    }
}
