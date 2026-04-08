import type { NextConfig } from "next";
import path from "node:path";

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"), // root env
});

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname, ".."),
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.olaclick.app",
      },
      {
        protocol: "https",
        hostname: "d2nagnwby8accc.cloudfront.net",
      },
       {
        protocol: "https",
        hostname: "photos.tryotter.com",
      }
    ],
  },
};

export default nextConfig;
