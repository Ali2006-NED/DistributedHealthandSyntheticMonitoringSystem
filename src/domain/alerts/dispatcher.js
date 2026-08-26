import crypto from 'node:crypto';

export async function dispatchAlert(channel, event, fetchImpl = fetch) {
  const payload = { ...event, idempotencyKey: crypto.createHash('sha256').update(`${channel.id}:${event.incidentId}:${event.status}`).digest('hex') };
  const response = await fetchImpl(channel.config.url, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': payload.idempotencyKey, ...(channel.config.headers ?? {}) }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Alert delivery failed with ${response.status}`);
}
