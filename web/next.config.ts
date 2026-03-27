import type { NextConfig } from "next";
import path from "node:path";

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"), // root env
});

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
