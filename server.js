import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { Server } from 'socket.io';
import configPlugin from './src/api/plugins/config.js';
import authPlugin from './src/api/plugins/auth.js';
import healthRoutes from './src/api/routes/health.routes.js';
import authRoutes from './src/api/routes/auth.routes.js';
import monitorRoutes from './src/api/routes/monitor.routes.js';


export async function buildApp() {
  const app = Fastify({ logger: true });
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation failed',
      details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    });
  }

  const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;
  return reply.code(statusCode).send({ error: message });
  });

  await app.register(configPlugin);
  await app.register(cookie);
  await app.register(cors, { origin: app.config.CORS_ORIGIN,credentials: true });
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