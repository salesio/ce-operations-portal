# CE Mozambique Operations Dashboard — development image
# Serves the static dashboard via Vite on port 5173.
FROM node:22-bookworm-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# App source (overridden by bind-mount in docker-compose for live reload)
COPY . .

EXPOSE 5173

# Host 0.0.0.0 so the server is reachable from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
