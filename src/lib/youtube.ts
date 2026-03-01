/**
 * YouTube upload helper — server-side only
 * Uses the platform's OAuth2 refresh token to upload videos to the platform's channel.
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a project → Enable "YouTube Data API v3"
 * 3. Credentials → Create OAuth2 Client ID (choose "Desktop app")
 * 4. Download the client JSON, copy client_id and client_secret to .env.local
 * 5. Run `node scripts/get-yt-token.js` once to get your YOUTUBE_REFRESH_TOKEN
 * 6. Copy the refresh token to .env.local
 */

import { google } from "googleapis";
import { createReadStream } from "fs";

export type YouTubeUploadResult = {
    videoId: string;
    url: string;          // https://www.youtube.com/watch?v=...
    embedUrl: string;     // https://www.youtube.com/embed/...
};

function isConfigured() {
    return !!(
        process.env.YOUTUBE_CLIENT_ID &&
        process.env.YOUTUBE_CLIENT_SECRET &&
        process.env.YOUTUBE_REFRESH_TOKEN
    );
}

function getOAuth2Client() {
    // Only clientId + clientSecret needed for refresh-token flow.
    // Do NOT pass a redirect_uri here — it's only required during the initial
    // auth code exchange (handled by scripts/get-yt-token.js).
    const client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
    );
    client.setCredentials({
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
    });
    return client;
}

/**
 * Upload a video file from the local filesystem to the platform's YouTube channel.
 * Returns the video ID and URLs, or throws on failure.
 *
 * @param filePath  Absolute path to the (compressed) video file
 * @param title     Title to use on YouTube (usually the submission title)
 * @param description Optional description
 */
export async function uploadToYouTube(
    filePath: string,
    title: string,
    description = "",
): Promise<YouTubeUploadResult> {
    if (!isConfigured()) {
        throw new Error(
            "YouTube API not configured. Fill in YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN in .env.local"
        );
    }

    const auth = getOAuth2Client();
    const youtube = google.youtube({ version: "v3", auth });

    const privacy = (process.env.YOUTUBE_PRIVACY || "unlisted") as "unlisted" | "public" | "private";

    const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title: title.slice(0, 100),  // YouTube title max = 100 chars
                description: description.slice(0, 5000),
                categoryId: "27",            // Education
                tags: ["compete", "student", "competition"],
                ...(process.env.YOUTUBE_CHANNEL_ID
                    ? { channelId: process.env.YOUTUBE_CHANNEL_ID }
                    : {}),
            },
            status: {
                privacyStatus: privacy,
                selfDeclaredMadeForKids: false,
            },
        },
        media: {
            mimeType: "video/mp4",
            body: createReadStream(filePath),
        },
    });

    const videoId = res.data.id;
    if (!videoId) throw new Error("YouTube returned no video ID");

    return {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
}

export { isConfigured as isYouTubeConfigured };
