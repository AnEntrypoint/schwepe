# Use Node.js 18 LTS
FROM node:18-alpine

# Create app directory with proper permissions
RUN mkdir -p /app /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0 && \
    chown -R node:node /app /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0 && \
    chmod -R 755 /app /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY --chown=node:node . .

# Set proper permissions for all directories
RUN mkdir -p /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0 && \
    chown -R node:node /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0 && \
    chmod -R 755 /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0 && \
    chown -R node:node /app && \
    chmod -R 755 /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"]