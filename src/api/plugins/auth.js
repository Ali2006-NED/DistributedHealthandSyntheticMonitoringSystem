import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export default fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: app.config.JWT_SECRET,
    sign: { expiresIn: app.config.JWT_EXPIRES_IN },
    cookie: { cookieName: 'token', signed: false }
  });
  app.decorate('authenticate', async (request) => request.jwtVerify());
  app.decorate('requireRole', (roles) => async (request) => {
    await request.jwtVerify();

    if (!roles.includes(request.user.role)) {
      const error = new Error('Insufficient permissions');
      error.statusCode = 403;
      throw error;
    }
  });
}); 
