import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Margem para imagens grandes em base64 e overhead do JSON.
    middlewareClientMaxBodySize: "100mb",
  },
};

export default nextConfig;