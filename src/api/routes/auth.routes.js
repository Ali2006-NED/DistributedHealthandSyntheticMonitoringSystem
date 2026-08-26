import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const loginInput = z.object({ email: z.string().email(), password: z.string().min(8) });

export default async function authRoutes(app) {
  app.post('/login', async (request, reply) => {
    const { email, password } = loginInput.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email }, include: { memberships: { take: 1 } } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return reply.unauthorized('Invalid credentials');
    const membership = user.memberships[0];
    return { token: await app.jwt.sign({ sub: user.id, organizationId: membership.organizationId, role: membership.role }) };
  });
}
