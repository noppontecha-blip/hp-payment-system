import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server rejects cross-origin requests to Server Actions/HMR/RSC by default — needed so
  // colleagues on the office LAN (accessing via this machine's IP, not localhost) can use the app.
  allowedDevOrigins: ["192.168.1.155"],
};

export default nextConfig;
