FROM node:20-alpine

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code and migrations
COPY . .

# Expose backend API port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start backend server
CMD ["node", "src/server.js"]
