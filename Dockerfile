# Stage 1: Build the React Application
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (utilizing Docker layer caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all source files and compile the production build
COPY . .
RUN npm run build

# Stage 2: Serve the compiled files using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
