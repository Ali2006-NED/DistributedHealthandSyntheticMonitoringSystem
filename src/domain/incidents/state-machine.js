const transitions = {
  HEALTHY: ['DEGRADED', 'DOWN'],
  DEGRADED: ['HEALTHY', 'DOWN'],
  DOWN: ['ACKNOWLEDGED', 'HEALTHY', 'RESOLVED'],
  ACKNOWLEDGED: ['RESOLVED', 'DOWN'],
  RESOLVED: ['HEALTHY', 'DEGRADED', 'DOWN']
};

export function canTransition(from, to) {
  return from === to || transitions[from]?.includes(to);
}

export function statusForResult({ success, latencyMs }, maxLatencyMs = Infinity) {
  if (!success) return 'DOWN';
  return latencyMs > maxLatencyMs ? 'DEGRADED' : 'HEALTHY';
}
