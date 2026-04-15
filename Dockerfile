FROM node:20-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5555

CMD ["node", "server.js"]
