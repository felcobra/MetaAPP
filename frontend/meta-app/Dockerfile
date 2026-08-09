# ── MetaAPP Frontend — Dockerfile para VPS / EasyPanel ──────────────────────
#
# Multi-stage build:
#   1. deps       — instala node_modules de produção
#   2. builder    — roda next build (gera .next/standalone)
#   3. runner     — imagem mínima com apenas o necessário para rodar
#
# Variáveis de ambiente definidas AQUI são embarcadas no build (Next.js
# resolve NEXT_PUBLIC_* em build-time). Para alterar a URL da API sem
# reconstruir a imagem, passe a variável via environment do EasyPanel e
# adicione NEXT_PUBLIC_API_URL no ARG abaixo.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Build ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Precisa dos devDependencies (typescript, @types/*) para o build
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# A URL da API é necessária em build-time para o Next.js embutir no bundle.
# Passe via --build-arg no EasyPanel ou defina no campo Environment da UI.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Runner ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root (segurança)
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# output: 'standalone' gera uma cópia mínima em .next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
