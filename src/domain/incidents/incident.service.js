import { prisma } from '../../lib/prisma.js';
import { statusForResult } from './state-machine.js';

export async function recordProbeResult(monitor, result, emit = () => {}) {
  const saved = await prisma.probeResult.create({ data: { monitorId: monitor.id, success: result.success, statusCode: result.statusCode, latencyMs: result.latencyMs, error: result.error, requestMeta: result.requestMeta, responseMeta: result.responseMeta } });
  const status = statusForResult(result, monitor.config?.maxLatencyMs);
  if (status !== monitor.status) {
    await prisma.monitor.update({ where: { id: monitor.id }, data: { status } });
    const incident = status === 'HEALTHY'
      ? await prisma.incident.findFirst({ where: { monitorId: monitor.id, status: { in: ['DOWN', 'DEGRADED', 'ACKNOWLEDGED'] } }, orderBy: { startedAt: 'desc' } })
      : await prisma.incident.create({ data: { organizationId: monitor.organizationId, monitorId: monitor.id, status } });
    if (incident && status === 'HEALTHY') await prisma.incident.update({ where: { id: incident.id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
    emit('monitor.status.changed', { monitorId: monitor.id, status, incidentId: incident?.id });
  }
  return saved;
}
