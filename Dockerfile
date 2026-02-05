# Production Docker Configuration
# Optimized for security, performance, and minimal image size

FROM node:18-alpine AS base

# Install system dependencies
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
# ML Service Builder Stage
# ===============================
FROM python:3.9-alpine AS ml-builder

WORKDIR /ml

# Install Python dependencies
COPY ml-service/requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

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

# ===============================
# Production ML Service Image
# ===============================
FROM python:3.9-alpine AS ml-service

WORKDIR /ml

# Create non-root user
RUN addgroup -g 1001 -S mluser && \
    adduser -S mluser -u 1001

# Install runtime dependencies
RUN apk add --no-cache libsndfile

# Copy Python dependencies
COPY --from=ml-builder --chown=mluser:mluser /root/.local /home/mluser/.local

# Copy ML service code
COPY --chown=mluser:mluser ml-service/ .

USER mluser

# Add local bin to PATH
ENV PATH=/home/mluser/.local/bin:$PATH

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')"

CMD ["python", "app.py"]
