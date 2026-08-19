import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  async headers() {
    return [
      {
        source: "/vote/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
