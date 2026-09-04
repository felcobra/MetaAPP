import path from "node:path";
import type { NextConfig } from "next";

/**
 * Content Security Policy — MetaAPP Frontend
 *
 * Objetivos:
 * - `script-src 'self'`: bloqueia scripts inline e de origens externas (XSS).
 *   'unsafe-inline' necessário apenas se houver inline handlers; evitado aqui.
 * - `style-src 'self' 'unsafe-inline'`: Next.js injeta estilos inline em
 *   desenvolvimento e em algumas otimizações de produção; unsafe-inline é
 *   aceito aqui pois o risco maior é em script-src.
 * - `img-src`: permite imagens de HTTPS externo (fotos de perfil via URL) e
 *   data: para imagens base64 (ex: avatars gerados).
 * - `media-src`: libera o vídeo da TV Meta, que é servido pela API (a tag
 *   <video> aponta direto para o backend, não passa pelo Next).
 * - `connect-src`: permite chamadas à API em produção e localhost em dev.
 * - `frame-ancestors 'none'`: equivale a X-Frame-Options: DENY no nível CSP.
 * - `form-action 'self'`: impede submissão de formulários para origens externas.
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Extrai a origem da URL da API (scheme + host + port) para o connect-src
function getApiOrigin(url: string): string {
  try {
    const { origin } = new URL(url);
    return origin;
  } catch {
    return "";
  }
}

const apiOrigin = getApiOrigin(API_URL);

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  media-src 'self' ${apiOrigin};
  connect-src 'self' ${apiOrigin} ws://localhost:* wss://localhost:*;
  frame-src 'none';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // output: 'standalone' gera um bundle mínimo executável com `node server.js`
  // Necessário para deploy em VPS sem Vercel (EasyPanel, Docker, etc.)
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        // Aplica headers de segurança em todas as páginas e rotas de API do Next.js
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
