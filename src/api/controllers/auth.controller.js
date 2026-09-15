import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { loginSchema, parseBody, registerSchema } from '../../config/env.js';
import { getMembership, getUserById } from '../../domain/users/user.service.js';
import { setAuthCookie } from '../utils/auth-cookie.js';
import { createSlug } from '../utils/slug.js';

export { getMembership, getUserById };

/**
 * Register a new user and create their organization and owner membership.
 * POST /v1/auth/register
 * Body: { email, password, organizationName, organizationSlug? }
 * @param {*} req
 * @param {*} res
 * @returns {Promise<void>}
 */
export async function registerUser(request, reply) {
  const input = parseBody(registerSchema, request, reply);
  if (!input) return;

  const { email, password, organizationName, organizationSlug } = input;

  const slug = createSlug(organizationSlug || organizationName);
  if (!slug) {
    return reply.code(400).send({ error: 'organizationName must contain letters or numbers' });
  }

  const userAlreadyExists = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (userAlreadyExists) {
    return reply.code(400).send({ error: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const { user, organization, membership } = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: organizationName.trim(), slug }
      });
      const user = await tx.user.create({ data: { email: email.trim().toLowerCase(), passwordHash } });
      const membership = await tx.membership.create({
        data: { userId: user.id, organizationId: organization.id, role: 'OWNER' }
      });
      return { user, organization, membership };
    });

    const token = await reply.jwtSign({
      userId: user.id,
      organizationId: organization.id,
      role: membership.role
    });

    setAuthCookie(reply, token);

    return reply.code(201).send({
      id: user.id,
      email: user.email,
      organizationId: organization.id,
      organizationName: organization.name,
      role: membership.role,
    });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return reply.code(409).send({ error: 'Organization slug already exists' });
    }
    throw error;
  }
}

/**
 * Login user and return JWT token
 * POST /v1/auth/login
 * Body: { email, password }
 * @param {*} req
 * @param {*} res
 * @returns {Promise<void>}
 */
export async function logIn(request, reply) {
  const input = parseBody(loginSchema, request, reply);
  if (!input) return;

  const { email, password } = input;

  // Query user by email from PostgreSQL
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      memberships: {
        include: { organization: true }
      }
    }
  });

  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Get first membership (organization context)
  const membership = user.memberships[0];
  if (!membership) {
    return reply.code(401).send({ error: 'User has no organization membership' });
  }

  const token = await reply.jwtSign({
    userId: user.id,
    organizationId: membership.organizationId,
    role: membership.role
  });

  setAuthCookie(reply, token);

  return reply.code(200).send({
    id: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  });
}

export async function logOut(request, reply) {
  reply.clearCookie('token',{path:'/'});
  return reply.code(204).send();

}
