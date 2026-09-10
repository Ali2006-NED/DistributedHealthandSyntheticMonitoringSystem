import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';

function createSlug(value) {
  let slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60);

  while (slug.startsWith('-')) slug = slug.slice(1);
  while (slug.endsWith('-')) slug = slug.slice(0, -1);
  return slug;
}

/**
 * Register a new user and create their organization and owner membership.
 * POST /v1/auth/register
 * Body: { email, password, organizationName, organizationSlug? }
 * @param {*} req
 * @param {*} res
 * @returns {Promise<void>}
 */
export async function registerUser(request, reply) {
  const { email, password, organizationName, organizationSlug } = request.body;

  if (!email || !password || !organizationName) {
    return reply.code(400).send({ error: 'email, password, and organizationName are required' });
  }

  const slug = createSlug(organizationSlug || organizationName);
  if (!slug) {
    return reply.code(400).send({ error: 'organizationName must contain letters or numbers' });
  }

  const userAlreadyExists = await prisma.user.findUnique({
    where: { email }
  });

  if (userAlreadyExists) {
    return reply.code(400).send({ error: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { user, organization, membership } = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: organizationName.trim(), slug }
      });
      const user = await tx.user.create({ data: { email, passwordHash } });
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

    reply.setCookie('token', token);

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
  const { email, password } = request.body;

  // Query user by email from PostgreSQL
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { organization: true }
      }
    }
  });

  if (!user) {
    return reply.code(400).send({ error: 'Invalid credentials' });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return reply.code(400).send({ error: 'Invalid credentials' });
  }

  // Get first membership (organization context)
  const membership = user.memberships[0];
  if (!membership) {
    return reply.code(400).send({ error: 'User has no organization membership' });
  }

  const token = await reply.jwtSign({
    userId: user.id,
    organizationId: membership.organizationId,
    role: membership.role
  });

  reply.setCookie('token', token);

  return reply.code(200).send({
    id: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  });
}

/**
 * Get user by ID from PostgreSQL
 * Used for JWT verification and profile fetches
 * @param {string} userId
 * @returns {Promise<Object>} user
 */
export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Verify user membership in organization
 * Returns membership with role for RBAC checks
 * @param {string} userId
 * @param {string} organizationId
 * @returns {Promise<Object>} membership
 */
export async function getMembership(userId, organizationId) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId }
    },
    include: { organization: true }
  });

  if (!membership) {
    throw new Error('User is not a member of this organization');
  }

  return membership;
}
