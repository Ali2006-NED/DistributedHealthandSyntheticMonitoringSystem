import { Queue } from 'bullmq';
import { env } from '../config/env.js';
import { createRedisConnection } from './redis.js';

export const probeQueue = new Queue(env.PROBE_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 1000, removeOnFail: 5000 }
});
