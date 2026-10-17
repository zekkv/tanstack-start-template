# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
# Optional Sentry auth token: mount as a build secret so source maps are uploaded
# only when the secret exists (vite.config.ts skips the plugin when it is unset).
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null)" \
    bun run build

# Migration target: full deps + source, run as a one-shot service by docker-compose.
FROM builder AS migrate
CMD ["bun", "run", "db:migrate"]

FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/.output ./.output
EXPOSE 3000
USER bun
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "--bun", "--import", "./.output/server/instrument.server.mjs", ".output/server/index.mjs"]
