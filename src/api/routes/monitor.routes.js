import { z } from 'zod';
import { createMonitor, getMonitor, listMonitors } from '../../domain/monitors/monitor.service.js';

const monitorInput = z.object({ name: z.string().min(1), type: z.enum(['HTTP', 'TCP', 'DNS']), target: z.string().min(1), config: z.record(z.string(), z.any()).default({}), intervalSeconds: z.number().int().min(10).default(60), timeoutMs: z.number().int().positive().default(5000), failureThreshold: z.number().int().positive().default(3) });

export default async function monitorRoutes(app) {
  app.addHook('preHandler', app.authenticate);
  app.get('/', async (request) => listMonitors(request.user.organizationId));
  app.get('/:id', async (request, reply) => {
    const monitor = await getMonitor(request.user.organizationId, request.params.id);
    if (!monitor) return reply.notFound();
    return monitor;
  });
  app.post('/', { preHandler: app.requireRole(['OWNER', 'ADMIN', 'RESPONDER']) }, async (request, reply) => {
    const input = monitorInput.parse(request.body);
    return reply.code(201).send(await createMonitor(request.user.organizationId, input));
  });
}
