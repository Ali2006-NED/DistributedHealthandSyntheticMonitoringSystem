import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';
import configPlugin from './plugins/config.js';
import authPlugin from './plugins/auth.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import monitorRoutes from './routes/monitor.routes.js';

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(configPlugin);
  await app.register(cors, { origin: app.config.CORS_ORIGIN });
  await app.register(helmet);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(monitorRoutes, { prefix: '/v1/monitors' });
  return app;
}

const app = await buildApp();
const io = new Server(app.server, { cors: { origin: app.config.CORS_ORIGIN } });
io.on('connection', (socket) => socket.on('organization:join', (organizationId) => socket.join(`organization:${organizationId}`)));
app.decorate('io', io);
await app.listen({ host: app.config.API_HOST, port: app.config.API_PORT });
