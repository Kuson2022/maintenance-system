/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Allow cross-origin requests from local network for mobile testing
  allowedDevOrigins: [
    "http://192.168.1.110",
    "http://192.168.1.*",
    "http://192.168.*.*",
  ],
};

module.exports = nextConfig;