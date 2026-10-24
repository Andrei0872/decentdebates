import type { NextConfig } from "next";
// Validates the env at build time, not first at runtime.
import "./src/env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
