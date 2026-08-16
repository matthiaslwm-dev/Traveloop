import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its standard-14 font .afm files via fs + __dirname at
  // runtime; bundling it rewrites __dirname to a virtual path that doesn't
  // exist on disk (ENOENT), so it must stay an unbundled, plain require.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
