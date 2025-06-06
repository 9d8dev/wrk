import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove the aggressive server actions limit since we're using direct uploads
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: "50mb",
  //   },
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.wrk.so",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars*.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
