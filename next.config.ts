import type { NextConfig } from "next";
import { parsePublicEnv, parseServerEnv } from "./src/lib/env/schema";

// Fail `next dev` and `next build` at startup when a variable is missing or malformed,
// instead of on the first request that needs it.
parseServerEnv(process.env);
parsePublicEnv(process.env);

const nextConfig: NextConfig = {
  // Agent instructions live in .claude/ (gitignored); keep `next dev` from writing AGENTS.md.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
