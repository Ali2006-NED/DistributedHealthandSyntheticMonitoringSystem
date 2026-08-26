# Distributed Health & Synthetic Monitoring Platform

Backend foundation for multi-tenant API monitoring with Fastify, Prisma/PostgreSQL, BullMQ/Redis, and Socket.IO.

## Start local dependencies

```bash
docker compose up -d
copy .env.example .env
npm install
npm run db:generate
npm run db:migrate
```

Run the API and worker in separate terminals:

```bash
npm run dev:api
npm run dev:worker
```

## Backend layout

- `src/api`: HTTP gateway, JWT authentication, RBAC, rate limiting, and realtime sockets.
- `src/domain/probes`: HTTP, TCP, DNS execution and assertion rules.
- `src/domain/incidents`: result persistence and incident state transitions.
- `src/domain/alerts`: channel dispatch primitives with idempotency keys.
- `src/domain/monitors`: tenant-scoped monitor commands and repeat scheduling.
- `src/worker`: BullMQ consumer for non-blocking probe execution.
- `prisma/schema.prisma`: tenant-aware relational model and time-series indexes.

The next backend increments should add organization onboarding, cross-region quorum, maintenance-window checks, alert retry orchestration, status-page caching, and percentile analytics queries.
