import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PROBE_QUEUE_NAME: z.string().default('probe-execution'),
  PROBE_CONCURRENCY: z.coerce.number().int().positive().default(10)
});

export const env = schema.parse(process.env);

export const requestSchema = z.object({
  url: z.string({
    required_error: "URL is completely missing",
    invalid_type_error: "URL must be a valid string value"
  }).url({ message: "URL is malformed or invalid" })
}); 