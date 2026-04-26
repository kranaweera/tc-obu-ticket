import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bwip-js uses canvas bindings only needed server-side; exclude from client bundle
  serverExternalPackages: ["bwip-js", "firebase-admin"],
};

export default nextConfig;
