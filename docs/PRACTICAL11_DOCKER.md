# Practical 11 — Containerization with Docker and Docker Compose

Full-stack Task Management app shipped as three containers (frontend, backend, MongoDB)
and started with a single `docker compose up` command.

---

## 1. Objective

Containerize the React + Node/Express + MongoDB Task Management application and
orchestrate all services with Docker Compose so the entire stack starts with one
command, with no manual setup steps between.

## 2. Architecture

```
docker-compose.yml
├── frontend  (React, built + served, host port 5173)
├── backend   (Node/Express, host port 5000)
└── mongodb   (official mongo:7 image, host port 27017)

Network: app-network (bridge)

frontend ──► backend ──► mongodb
   (5173)      (5000)      (27017)

All 3 services start together via: docker compose up
```

- The Compose project defines an internal bridge network `app-network`.
- Services reach each other by **service name** (`frontend`, `backend`, `mongodb`),
  not `localhost`.

## 3. Files added

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Builds the Node/Express API (deps installed inside the container) |
| `frontend/Dockerfile` | **Multi-stage** build → tiny runtime image serving only the built static files |
| `backend/.dockerignore` | Excludes `node_modules`, `.env`, etc. from the build context |
| `frontend/.dockerignore` | Excludes `node_modules`, `dist`, `.env`, etc. from the build context |
| `docker-compose.yml` | Orchestrates `frontend`, `backend`, `mongodb` with ports, `depends_on`, a named volume, and `app-network` |

## 4. Dockerfiles

### Backend (`backend/Dockerfile`)

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Frontend (`frontend/Dockerfile`) — multi-stage

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
RUN npm install -g serve
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
```

Multi-stage is the key point: stage 1 compiles the React app; stage 2 copies only the
built `dist/` output into the final image, so the image ships **no source code, no dev
dependencies, no node_modules** — only the static files.

## 5. docker-compose.yml

```yaml
services:
  frontend:
    build: { context: ./frontend }
    ports: ["5173:5173"]
    depends_on: [backend]
    networks: [app-network]

  backend:
    build: { context: ./backend }
    ports: ["5000:5000"]
    environment:
      - MONGO_URI=mongodb://mongodb:27017/taskdb   # service name, not localhost
      - PORT=5000
    depends_on: [mongodb]
    networks: [app-network]

  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes:
      - mongo-data:/data/db                        # named volume → data persists
    networks: [app-network]

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
```

## 6. How to run

Prerequisite: Docker Desktop (or Docker Engine) running.

```bash
cd Task_Manager
docker compose up --build
```

Verify (in another terminal):

```bash
docker compose ps          # all 3 containers "Up"
docker ps                  # container list & port mappings
```

Then open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000 (e.g. `GET http://localhost:5000/tasks`)
- MongoDB: mongodb://localhost:27017

Stop the stack:

```bash
docker compose down         # stops containers (keeps the named volume → data persists)
docker compose down -v      # also removes the named volume
```

## 7. Key questions (short answers)

- **Why does the backend reference MongoDB by service name, not `localhost`?**
  Each container has its own network namespace — `localhost` inside the backend
  container is the backend container itself, not the MongoDB container. On the
  bridge network, containers resolve each other by service name, so
  `mongodb://mongodb:27017/taskdb` is the correct address.
- **`EXPOSE` vs `ports` mapping?** `EXPOSE` is documentation only (a hint inside the
  image); it does **not** publish a port to the host. `ports` in Compose actually
  binds the container port to a host port (`"5173:5173"`), making it reachable from
  the host browser.
- **Why not copy `node_modules` into the image?** It is platform-specific, huge, and
  could be stale/out of date. Running `npm install` inside the container guarantees a
  clean, reproducible dependency tree matched to the Linux runtime image.

## 8. Supplementary problems

- [x] **`.dockerignore`** — `backend/.dockerignore` and `frontend/.dockerignore` exclude
      `node_modules`, `.env`, build output, etc. from the build context (faster builds,
      no secrets baked into the image).
- [x] **Multi-stage frontend build** — `frontend/Dockerfile` builds in stage 1 and only
      copies `dist/` into the final runtime image.
- [x] **Named volume for MongoDB** — `mongo-data:/data/db` so task data persists across
      container restarts/rebuilds.

## 9. Deliverables checklist

- [x] `backend/Dockerfile`
- [x] `frontend/Dockerfile` (multi-stage)
- [x] `backend/.dockerignore`, `frontend/.dockerignore`
- [x] `docker-compose.yml` — 3 services, ports, `depends_on`, `app-network`, named volume
- [x] Backend MongoDB connection moved to the Compose service name via `MONGO_URI`
- [x] README updated with `docker compose up` instructions
- [ ] Commit specifically for containerization
