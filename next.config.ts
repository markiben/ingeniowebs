import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone/tablet on Wi-Fi hit the PC via LAN IP. Without this, Next 16 blocks
  // /_next/* + HMR and the page stays blank forever.
  allowedDevOrigins: [
    "192.168.1.8",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
  experimental: {
    serverActions: {
      // Live chat: compressed images + documents up to ~25MB + multipart overhead.
      bodySizeLimit: "30mb",
    },
  },
  // Next 16 defaults to Turbopack; empty config acknowledges webpack below.
  turbopack: {},
  // Keep webpack ignore for optional --webpack runs. Use a RegExp (schema-safe).
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules|[/\\]data[/\\]|\.git|\.next/,
      };
    }
    return config;
  },
};

export default nextConfig;
