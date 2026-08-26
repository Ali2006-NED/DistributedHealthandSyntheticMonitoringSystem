import dns from 'node:dns/promises';

export async function runDnsProbe(monitor) {
  const startedAt = performance.now();
  try {
    const records = await dns.resolve(monitor.target, monitor.config?.recordType ?? 'A');
    return { success: records.length > 0, latencyMs: Math.round(performance.now() - startedAt), responseMeta: { records } };
  } catch (error) {
    return { success: false, latencyMs: Math.round(performance.now() - startedAt), error: error.message };
  }
}
