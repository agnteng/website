# branding.agnteng.com. Build context: the repository root (the workspace
# manifests and content/ live there), Dockerfile: apps/branding/Dockerfile.

# ── build ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
# Manifests first, so the dependency layer is cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/branding/package.json apps/branding/
COPY packages/brand/package.json packages/brand/
RUN pnpm install --frozen-lockfile
COPY . .
# LUMA_API_KEY is inlined here, from the .env Dokploy writes to the build
# context. Dokploy puts it beside this Dockerfile; astro.config.mjs reads .env
# from the repository root, so copy it there. Without this the build succeeds
# and the deck has no audience (docs/adr/0002).
RUN if [ -f apps/branding/.env ]; then cp apps/branding/.env .env; fi
RUN pnpm --filter branding build
# A self-contained copy of the app with production dependencies only: the SSR
# output imports react and astro's runtime rather than bundling them.
RUN pnpm --filter branding deploy --prod /out

# ── run ──────────────────────────────────────────────────────────────────
# Most pages are prerendered above; the deck pages and api/audience.json are
# on-demand, so this is a node process rather than nginx. The node adapter's
# standalone server serves the prerendered output itself.
FROM node:22-alpine
WORKDIR /app
COPY --from=build /out/package.json ./
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/branding/dist ./dist
# start.sh resolves .env.schema's secrets, then starts the server (docs/adr/0027).
COPY --from=build /repo/apps/branding/.env.schema /repo/apps/branding/start.sh ./
ENV HOST=0.0.0.0
# Port 80, which the service's existing port mapping expects.
ENV PORT=80
ENV APP_ENV=production
EXPOSE 80
CMD ["sh", "./start.sh"]
