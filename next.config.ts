import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its standard-14 font .afm files via fs + __dirname at
  // runtime; bundling it rewrites __dirname to a virtual path that doesn't
  // exist on disk (ENOENT), so it must stay an unbundled, plain require.
  serverExternalPackages: ["pdfkit"],
  images: {
    // The Photography experience card image is hosted on Unsplash — every
    // other image lives in /public and needs no entry here.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
