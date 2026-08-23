import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Muziclly Label (/label) uses Unsplash placeholder artist/release art,
    // matching the recovered "Muziclly Label" prototype's mock catalog.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
