FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Switch to non-root user
RUN addgroup -g 1001 -S node && \
    adduser -S node -u 1001 -G node

# Change ownership
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
