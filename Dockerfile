# Production Docker Configuration
# Optimized for security, performance, and minimal image size

FROM node:18-alpine AS base

# Install system dependencies (Python/Make/GCC required for node-gyp builds)
RUN apk add --no-cache \
    python3 \
    py3-pip \
    gcc \
    g++ \
    make \
    libc-dev

WORKDIR /app

# ===============================
# Backend Builder Stage
# ===============================
FROM base AS backend-builder

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# ===============================
# Production Backend Image
# ===============================
FROM base AS backend

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf \
    __tests__ \
    .git \
    .github \
    *.md \
    .env.example

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
