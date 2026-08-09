import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone' gera um bundle mínimo executável com `node server.js`
  // Necessário para deploy em VPS sem Vercel (EasyPanel, Docker, etc.)
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
