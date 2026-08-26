import { Worker } from 'bullmq';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { createRedisConnection } from '../lib/redis.js';
import { executeProbe } from '../domain/probes/runner.js';
import { recordProbeResult } from '../domain/incidents/incident.service.js';

const worker = new Worker(env.PROBE_QUEUE_NAME, async (job) => {
  const monitor = await prisma.monitor.findUnique({ where: { id: job.data.monitorId } });
  if (!monitor?.enabled) return;
  const result = await executeProbe(monitor);
  await recordProbeResult(monitor, result);
}, { connection: createRedisConnection(), concurrency: env.PROBE_CONCURRENCY });

worker.on('completed', (job) => console.log(`Probe completed: ${job.id}`));
worker.on('failed', (job, error) => console.error(`Probe failed: ${job?.id}`, error));
