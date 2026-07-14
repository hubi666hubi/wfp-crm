# ===== STAGE 1: Builder =====
FROM node:22-alpine AS builder
WORKDIR /app

# Install build tools for native modules (sharp, canvas, etc.)
RUN apk add --no-cache python3 make g++ vips-dev

# Copy package files + local packages first (needed for npm ci)
COPY package*.json ./
COPY server/dataconnect ./server/dataconnect

# Install ALL deps (including dev) for build
RUN npm ci

# Copy the rest of the source
COPY . .

# Build: Vite (frontend) + esbuild (backend)
RUN npm run build

# ===== STAGE 2: Production =====
FROM node:22-alpine
WORKDIR /app

# Runtime libs for native modules
RUN apk add --no-cache vips

# Copy package files + local packages
COPY package*.json ./
COPY server/dataconnect ./server/dataconnect

# Only production deps
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Production environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run compiled server (also serves the React SPA)
CMD ["node", "dist/server.cjs"]