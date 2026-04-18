import type { NextConfig } from "next";

const noCache = [
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  { key: "Pragma",        value: "no-cache" },
  { key: "Expires",       value: "0" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/pricing",          headers: noCache },
      { source: "/trial",            headers: noCache },
      { source: "/dashboard/:path*", headers: noCache },
      {
        source: "/((?!api|_next|.*\\.[^/]+$).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
