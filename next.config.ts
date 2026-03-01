import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark Node.js-only packages so Turbopack doesn't try to bundle them
  serverExternalPackages: ["fluent-ffmpeg", "@ffmpeg-installer/ffmpeg", "googleapis", "busboy"],

  // Allow large video/audio uploads (up to 500 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fmftxonaruysuvgiuvbu.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
