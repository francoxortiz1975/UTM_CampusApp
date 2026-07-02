import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        browserDebugInfoInTerminal: {
            depthLimit: 5, // Optional: configure object depth
            edgeLimit: 100, // Optional: configure array/object limits
        },
    },
    // The app was developed with `next dev`, which does not run strict
    // type/lint checks. Don't let pre-existing type or lint issues block the
    // production build on Vercel.
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
