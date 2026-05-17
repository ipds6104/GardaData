FROM node:20-alpine
WORKDIR /app

# Install production dependencies only to keep the image size small
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
