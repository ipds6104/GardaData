# ============================================================
# Stage 1: Build the React Frontend
# ============================================================
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ============================================================
# Stage 2: Production - Node.js Backend + Serve Frontend
# ============================================================
FROM node:22-alpine
WORKDIR /app

# Copy backend source code
COPY backend/ ./backend/

# Copy the compiled React frontend from the build stage
COPY --from=build /app/dist ./dist

# Install backend production dependencies
WORKDIR /app/backend
RUN npm install

# Go back to root working dir
WORKDIR /app

EXPOSE 5000

CMD ["node", "backend/server.js"]
