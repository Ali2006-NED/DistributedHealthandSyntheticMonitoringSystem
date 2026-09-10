import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';
import configPlugin from './src/api/plugins/config.js';
import authPlugin from './src/api/plugins/auth.js';
import healthRoutes from './src/api/routes/health.routes.js';
import authRoutes from './src/api/routes/auth.routes.js';
import monitorRoutes from './src/api/routes/monitor.routes.js';
import {testDatabaseConnection} from './src/db/db.js';

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(configPlugin);
  await app.register(cookie);
  await app.register(cors, { origin: app.config.CORS_ORIGIN });
  await app.register(helmet);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(monitorRoutes, { prefix: '/v1/monitors' });
  await testDatabaseConnection(); // Test database connection on startup  

  return app;
}

const app = await buildApp();
const io = new Server(app.server, { cors: { origin: app.config.CORS_ORIGIN } });
io.on('connection', (socket) => socket.on('organization:join', (organizationId) => socket.join(`organization:${organizationId}`)));
app.decorate('io', io);
await app.listen({ host: app.config.API_HOST, port: app.config.API_PORT });