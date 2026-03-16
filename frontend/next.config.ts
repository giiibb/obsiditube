import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In production (Vercel), /api/convert is served by the Python serverless function.
  // In local dev, proxy it to the FastAPI server running on port 8000.
  ...(process.env.NODE_ENV === "development" && {
    async rewrites() {
      return [
        {
          source: "/api/convert",
          destination: "http://localhost:8000/api/convert",
        },
      ];
    },
  }),
};

export default nextConfig;
