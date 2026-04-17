import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma v7 uses a WASM-based query compiler.
  // Vercel doesn't auto-bundle these files — include them explicitly.
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs",
      "./node_modules/@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.js",
      "./node_modules/@prisma/client/runtime/client.js",
      "./node_modules/@prisma/client/runtime/client.mjs",
    ],
  },
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
