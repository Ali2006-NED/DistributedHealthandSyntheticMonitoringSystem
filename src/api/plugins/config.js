import fp from 'fastify-plugin';
import { env } from '../../config/env.js';

export default fp(async (app) => { app.decorate('config', env); });
