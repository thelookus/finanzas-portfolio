import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["better-sqlite3", "pdf-parse", "pdfjs-dist"],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
