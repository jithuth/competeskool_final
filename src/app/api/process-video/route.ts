/**
 * POST /api/process-video
 *
 * Receives a lightweight JSON body { storagePath, title, description }
 * (the file was already uploaded directly to Supabase from the client).
 * The server then:
 *   1. Downloads the file from Supabase storage
 *   2. Compresses with ffmpeg (if > 15 MB)
 *   3. Uploads to platform YouTube channel (if configured)
 *   4. Falls back to storing the compressed version back in Supabase
 */

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

ffmpeg.setFfmpegPath(ffmpegPath.path);

const SKIP_COMPRESSION_THRESHOLD = 15 * 1024 * 1024; // 15 MB

export const runtime = "nodejs";
export const maxDuration = 300;

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
                "-vcodec libx264", "-crf 26", "-preset fast",
                "-vf scale='min(1280,iw)':-2",
                "-maxrate 1.5M", "-bufsize 3M",
                "-acodec aac", "-b:a 128k",
                "-movflags +faststart", "-y",
            ])
            .output(output)
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .run();
    });
}

export async function POST(req: NextRequest) {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Parse tiny JSON body — no size limit issue, it's just a path string
    let storagePath: string, title: string, description: string;
    try {
        const body = await req.json();
        storagePath = body.storagePath;
        title = body.title || "Submission";
        description = body.description || "";
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!storagePath) {
        return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
    }

    const supa = adminSupabase();

    // 3. Download the uploaded file from Supabase Storage
    const { data: blob, error: dlError } = await supa.storage
        .from("submissions")
        .download(storagePath);

    if (dlError || !blob) {
        return NextResponse.json({ error: `Download failed: ${dlError?.message}` }, { status: 500 });
    }

    const inputBuffer = Buffer.from(await blob.arrayBuffer());
    const ext = storagePath.split(".").pop()?.toLowerCase() || "mp4";
    const id = randomUUID();
    const inputPath = join(tmpdir(), `${id}-input.${ext}`);
    const outputPath = join(tmpdir(), `${id}-output.mp4`);

    try {
        await writeFile(inputPath, inputBuffer);

        let finalPath = inputPath;
        let finalExt = ext;
        let compressed = false;
        const originalSizeMb = (inputBuffer.length / 1024 / 1024).toFixed(2);
        let finalSizeMb = originalSizeMb;
        let savings = "0%";

        // 4. Compress if video is large enough
        if (inputBuffer.length > SKIP_COMPRESSION_THRESHOLD) {
            try {
                await compressToMp4(inputPath, outputPath);
                const compressedStat = await stat(outputPath);
                if (compressedStat.size < inputBuffer.length) {
                    finalPath = outputPath;
                    finalExt = "mp4";
                    compressed = true;
                    finalSizeMb = (compressedStat.size / 1024 / 1024).toFixed(2);
                    savings = `${Math.round((1 - compressedStat.size / inputBuffer.length) * 100)}%`;
                }
            } catch (comprErr: any) {
                console.error("[process-video] Compression error, using original:", comprErr.message);
            }
        }

        // 5. Try YouTube upload
        if (isYouTubeConfigured()) {
            try {
                const ytResult = await uploadToYouTube(finalPath, title, description);

                // Delete original from Supabase (YouTube is now the source of truth)
                await supa.storage.from("submissions").remove([storagePath]).catch(() => { });

                return NextResponse.json({
                    success: true,
                    storageType: "youtube",
                    youtubeId: ytResult.videoId,
                    youtubeUrl: ytResult.url,
                    embedUrl: ytResult.embedUrl,
                    originalSizeMb,
                    finalSizeMb,
                    compressed,
                    savings,
                });
            } catch (ytErr: any) {
                console.error("[process-video] YouTube upload failed, saving compressed to Supabase:", ytErr.message);
            }
        }

        // 6. Supabase fallback — if we compressed, replace the original with the smaller file
        if (compressed) {
            const compressedBuffer = await readFile(finalPath);
            const newPath = storagePath.replace(/\.[^.]+$/, ".mp4");
            await supa.storage.from("submissions").remove([storagePath]).catch(() => { });
            await supa.storage.from("submissions").upload(newPath, compressedBuffer, {
                contentType: "video/mp4", upsert: true,
            });
            const { data: { publicUrl } } = supa.storage.from("submissions").getPublicUrl(newPath);

            return NextResponse.json({
                success: true,
                storageType: "supabase",
                url: publicUrl,
                path: newPath,
                originalSizeMb, finalSizeMb, compressed, savings,
            });
        }

        // No compression, already in Supabase — just return the existing public URL
        const { data: { publicUrl } } = supa.storage.from("submissions").getPublicUrl(storagePath);
        return NextResponse.json({
            success: true,
            storageType: "supabase",
            url: publicUrl,
            path: storagePath,
            originalSizeMb, finalSizeMb, compressed, savings,
        });

    } finally {
        await unlink(inputPath).catch(() => { });
        await unlink(outputPath).catch(() => { });
    }
}
