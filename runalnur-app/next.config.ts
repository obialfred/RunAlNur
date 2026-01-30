import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  // Make updates apply immediately (avoid "no difference on phone" after deploy)
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Don't let service worker intercept external storage uploads
    runtimeCaching: [
      {
        // Cloudflare R2 presigned uploads - must bypass service worker
        urlPattern: /\.r2\.cloudflarestorage\.com/,
        handler: "NetworkOnly",
      },
      {
        // Also exclude any other S3-compatible storage
        urlPattern: /X-Amz-Signature=/,
        handler: "NetworkOnly",
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Empty turbopack config to silence warning
  turbopack: {},
  // Ensure images work properly
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
