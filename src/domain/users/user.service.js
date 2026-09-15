import { prisma } from '../../lib/prisma.js';

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
