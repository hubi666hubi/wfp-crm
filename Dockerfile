# ===== STAGE 1: Builder =====
FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (including dev) for build
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ===== STAGE 2: Production =====
FROM node:22-alpine
WORKDIR /app

# Only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Set production mode
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run the compiled server (which also serves the React SPA)
CMD ["node", "dist/server.cjs"]