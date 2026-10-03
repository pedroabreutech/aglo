ARG NODE_VERSION=20.14.0

# Base image with pnpm enabled. We install deps once (using the lockfile)
FROM node:${NODE_VERSION}-bullseye-slim AS builder

WORKDIR /app

RUN npm install -g corepack@latest && corepack enable

# Copy package metadata first to leverage Docker layer cache for deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG APP_ENV_FILE=envs/dev.env
ARG DISABLE_ESLINT_PLUGIN=true

RUN test -f "${APP_ENV_FILE}" \
  && set -a \
  && . "${APP_ENV_FILE}" \
  && set +a && pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000 3001

CMD ["node", "server.js"]