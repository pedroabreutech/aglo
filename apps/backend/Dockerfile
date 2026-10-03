FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm exec prisma generate
RUN pnpm run build

# -------------------- #

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV COREPACK_HOME=/home/node/.cache/node/corepack

RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY --chown=node:node package.json pnpm-lock.yaml prisma.config.ts ./

COPY --from=deps --chown=node:node /app/build ./build
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=deps --chown=node:node /app/prisma ./prisma

RUN chown node:node /app && mkdir -p "$COREPACK_HOME" && chown -R node:node "$COREPACK_HOME"

USER node

EXPOSE 3000
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${MANAGEMENT_PORT:-3001}/api/v1/healthz" >/dev/null || exit 1

CMD ["sh", "-c", "DATABASE_URL=\"$MIGRATE_DATABASE_URL\" pnpm exec prisma migrate deploy && exec node --max-old-space-size=4096 --max-semi-space-size=128 build/index.js"]
