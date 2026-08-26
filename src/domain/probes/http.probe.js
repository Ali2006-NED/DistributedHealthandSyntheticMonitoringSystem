import { evaluateAssertions } from './assertions.js';

export async function runHttpProbe(monitor) {
  const config = monitor.config ?? {};
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), monitor.timeoutMs);
  try {
    const response = await fetch(monitor.target, {
      method: config.method ?? 'GET',
      headers: config.headers ?? {},
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: controller.signal
    });
    const body = await response.text();
    const latencyMs = Math.round(performance.now() - startedAt);
    let json;
    try { json = JSON.parse(body); } catch { json = undefined; }
    const passed = evaluateAssertions({ status: response.status, body, json, latencyMs }, config.assertions);
    return { success: response.ok && passed, statusCode: response.status, latencyMs, responseMeta: { headers: Object.fromEntries(response.headers), body: body.slice(0, 10000) }, error: passed ? undefined : 'Assertion failed' };
  } catch (error) {
    return { success: false, latencyMs: Math.round(performance.now() - startedAt), error: error.name === 'AbortError' ? 'Request timed out' : error.message };
  } finally {
    clearTimeout(timeout);
  }
}
