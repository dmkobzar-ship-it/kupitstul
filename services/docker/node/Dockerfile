FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY chat-server/package*.json ./

# Install dependencies
RUN npm ci --production

# Copy app code
COPY chat-server/ ./

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

EXPOSE 3002

USER node
CMD ["node", "server.js"]
