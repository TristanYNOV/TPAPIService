# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including dev) required for building the project
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
