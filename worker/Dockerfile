# Multi-stage minimal Dockerfile for Zukai Fastify Audio Processing Worker
# Stage 1: Build & TypeScript compilation
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Stage 2: Production runtime image
FROM node:22-alpine AS runner

WORKDIR /app

# Install ffmpeg and libmagic for audio processing and format verification
RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Run as non-root user
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/healthz || exit 1

CMD ["node", "dist/server.js"]

