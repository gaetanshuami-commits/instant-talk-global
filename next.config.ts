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
        // Force le navigateur à toujours charger la version la plus récente
        // Empêche le cache navigateur de servir un vieux build
        source: "/dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/((?!api|_next|.*\\.[^/]+$).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Type", value: "text/html; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
