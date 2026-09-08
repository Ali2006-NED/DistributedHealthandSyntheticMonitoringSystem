import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';

/**
 * Register a new user and create membership for organization
 * POST /v1/auth/register
 * Body: { email, password, organizationId }
 * @param {*} req
 * @param {*} res
 * @returns {Promise<void>}
 */
export async function registerUser(req, res) {
  const { email, password, organizationId } = req.body;

  // Check if user already exists
  const userAlreadyExists = await prisma.user.findUnique({
    where: { email }
  });

  if (userAlreadyExists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user in PostgreSQL
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash
    }
  });

  // Create membership linking user to organization with OWNER role for first user
  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId,
      role: 'OWNER' // First user gets owner role
    }
  });

  return res.status(201).json({
    id: user.id,
    email: user.email,
    organizationId,
    role: membership.role
  });
}

/**
 * Login user and return JWT token
 * POST /v1/auth/login
 * Body: { email, password }
 * @param {*} req
 * @param {*} res
 * @returns {Promise<void>}
 */
export async function logIn(req, res) {
  const { email, password } = req.body;

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
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Get first membership (organization context)
  const membership = user.memberships[0];
  if (!membership) {
    return res.status(400).json({ error: 'User has no organization membership' });
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role
  });
}

/**
 * Get user by ID from PostgreSQL
 * Used for JWT verification and profile fetches
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