import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        browserDebugInfoInTerminal: {
            depthLimit: 5, // Optional: configure object depth
            edgeLimit: 100, // Optional: configure array/object limits
        },
    },
};

export default nextConfig;
