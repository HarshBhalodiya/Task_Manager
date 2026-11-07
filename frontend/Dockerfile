# ---- Frontend Dockerfile (React/Vite) ----
# Multi-stage build (Supplementary Problem). Stage 1 compiles the React app to
# static files; Stage 2 copies only those built files into a tiny runtime image.
# The final image contains NO source code and NO dev dependencies.

# --- Stage 1: build ---
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# --- Stage 2: runtime (serves only the built static files) ---
FROM node:18-alpine

WORKDIR /app

# Copy the compiled output from the build stage.
COPY --from=build /app/dist ./dist

# Serve the static build. npx with a pinned install keeps the runtime image small.
RUN npm install -g serve

EXPOSE 5173

# serve -s: single-page app fallback to index.html; -l 5173: listen on 5173.
CMD ["serve", "-s", "dist", "-l", "5173"]
