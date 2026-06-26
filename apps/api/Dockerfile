# ─── Base (shared tools) ───────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache postgresql-client

# ─── Dependencies ───────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ─── Development ────────────────────────────────────────────────────────────
FROM deps AS development
COPY . .
RUN chmod +x scripts/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# ─── Build ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ─── Production ─────────────────────────────────────────────────────────────
FROM base AS production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY src/migrations ./src/migrations
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
