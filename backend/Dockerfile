# ---- Backend Dockerfile (Node/Express) ----
# Multi-stage not required for the API itself, but a slim runtime image keeps the
# final backend image small. Dependencies are installed INSIDE the container (never
# copied from the host), so the image is reproducible and host-OS independent.

FROM node:18-alpine AS deps

WORKDIR /app

# Install dependencies first (leverages Docker layer caching when package.json is
# unchanged between builds).
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# ---- Runtime stage ----
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy the installed node_modules and the application source.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

# In Docker the MongoDB host is the Compose service name, overridden by the
# MONGO_URI environment variable set in docker-compose.yml (see Practical 11).
CMD ["node", "server.js"]
