FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

COPY server.js ./

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 chatuser

USER chatuser

EXPOSE 3002
ENV NODE_ENV=production

CMD ["node", "server.js"]
