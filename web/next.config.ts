import type { NextConfig } from "next";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../.env"), // root env
});

const bucketEndpoint = process.env.RAILWAY_BUCKET_ENDPOINT || process.env.ENDPOINT;
const bucketHostname = bucketEndpoint
  ? new URL(bucketEndpoint).hostname
  : null;
const bucketPublicBaseUrl =
  process.env.RAILWAY_BUCKET_PUBLIC_BASE_URL || process.env.BUCKET_PUBLIC_BASE_URL;
const bucketPublicHostname = bucketPublicBaseUrl
  ? new URL(bucketPublicBaseUrl).hostname
  : null;
const bucketName = process.env.RAILWAY_BUCKET_NAME || process.env.BUCKET;

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
      },
      ...(bucketHostname
        ? [
            {
              protocol: "https" as const,
              hostname: bucketHostname,
              ...(bucketName
                ? { pathname: `/${bucketName}/**` }
                : {}),
            },
          ]
        : []),
      ...(bucketPublicHostname
        ? [
            {
              protocol: "https" as const,
              hostname: bucketPublicHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
