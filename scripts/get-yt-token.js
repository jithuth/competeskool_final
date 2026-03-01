/**
 * One-time script to generate your YOUTUBE_REFRESH_TOKEN.
 * Uses a local HTTP server redirect (required since Google blocked OOB flow).
 *
 * BEFORE running:
 *   1. Fill YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET in .env.local
 *   2. In Google Cloud Console → Credentials → your OAuth client:
 *      Add "http://localhost:3009/callback" as an Authorised Redirect URI
 *   3. Run: node scripts/get-yt-token.js
 *   4. Browser opens automatically — sign in with the PLATFORM channel account
 *   5. Token is printed here and you paste it into .env.local
 */

const path = require("path");
const fs = require("fs");
const http = require("http");
const { exec } = require("child_process");

// ─── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
    }
}

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(`
❌  YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET not set in .env.local.

Steps:
  1. https://console.cloud.google.com → APIs & Services → Enable "YouTube Data API v3"
  2. Credentials → Create OAuth client ID → choose "Web application"
  3. Under "Authorised redirect URIs" add: http://localhost:3009/callback
  4. Copy Client ID + Secret into .env.local
  5. Run this script again
`);
    process.exit(1);
}

let google;
try { google = require("googleapis").google; }
catch { console.error("❌  Run: npm install googleapis"); process.exit(1); }

// ─── OAuth config ─────────────────────────────────────────────────────────────
const REDIRECT_URI = "http://localhost:3009/callback";
const SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
});

// ─── Start local callback server ──────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, REDIRECT_URI);

    if (url.pathname !== "/callback") {
        res.end("Not found");
        return;
    }

    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
        res.end(`<h2>❌ Authorisation denied: ${error}</h2><p>You can close this tab.</p>`);
        server.close();
        process.exit(1);
    }

    if (!code) {
        res.end("<h2>❌ No code received</h2><p>You can close this tab.</p>");
        server.close();
        process.exit(1);
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            res.end(`
<h2>⚠ No refresh_token returned</h2>
<p>This usually means the app was already authorised for this account.</p>
<p>Fix: Go to <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>,
revoke access for this app, then run the script again.</p>
`);
            server.close();
            return;
        }

        // Success
        res.end(`
<html><body style="font-family:sans-serif;padding:40px;background:#f0fdf4">
<h2 style="color:#16a34a">✅ Success! Token saved.</h2>
<p>You can close this tab and return to the terminal.</p>
</body></html>`);

        server.close();

        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  SUCCESS!

Copy this line into your .env.local file:

YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}

Then restart your dev server (npm run dev).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    } catch (err) {
        res.end(`<h2>❌ Token exchange failed</h2><pre>${err.message}</pre>`);
        server.close();
        console.error("❌  Token exchange error:", err.message);
    }
});

server.listen(3009, () => {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  YouTube Token Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Opening browser... Sign in with the PLATFORM's YouTube channel.

If the browser doesn't open, visit this URL manually:

${authUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    // Open browser automatically
    const openCmd = process.platform === "win32" ? `start "" "${authUrl}"` : `open "${authUrl}"`;
    exec(openCmd, (err) => {
        if (err) console.log("Could not open browser automatically. Please visit the URL above manually.");
    });
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error("❌  Port 3009 is in use. Close whatever is running on it and try again.");
    } else {
        console.error("❌  Server error:", err.message);
    }
    process.exit(1);
});
