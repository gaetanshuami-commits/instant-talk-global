import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // HTML pages only — not API routes, not static assets
        source: "/((?!api|_next|.*\\.[^/]+$).*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Language",
            value: "fr",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
