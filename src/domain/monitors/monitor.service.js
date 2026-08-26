import { prisma } from '../../lib/prisma.js';
import { probeQueue } from '../../lib/queues.js';

export async function listMonitors(organizationId) {
  return prisma.monitor.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
}

export async function createMonitor(organizationId, input) {
  const monitor = await prisma.monitor.create({ data: { ...input, organizationId } });
  await scheduleMonitor(monitor);
  return monitor;
}

export async function scheduleMonitor(monitor) {
  await probeQueue.add(`monitor:${monitor.id}`, { monitorId: monitor.id }, { jobId: monitor.id, repeat: { every: monitor.intervalSeconds * 1000 } });
}

export async function getMonitor(organizationId, id) {
  return prisma.monitor.findFirst({ where: { id, organizationId }, include: { incidents: { where: { status: { not: 'RESOLVED' } } } } });
}
