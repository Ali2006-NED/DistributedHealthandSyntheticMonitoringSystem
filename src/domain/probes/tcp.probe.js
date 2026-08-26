import net from 'node:net';

export function runTcpProbe(monitor) {
  const [host, rawPort] = monitor.target.split(':');
  const port = Number(rawPort);
  const startedAt = performance.now();
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (result) => { socket.destroy(); resolve({ ...result, latencyMs: Math.round(performance.now() - startedAt) }); };
    socket.setTimeout(monitor.timeoutMs, () => finish({ success: false, error: 'Connection timed out' }));
    socket.once('connect', () => finish({ success: true }));
    socket.once('error', (error) => finish({ success: false, error: error.message }));
  });
}
