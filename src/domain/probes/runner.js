import { runDnsProbe } from './dns.probe.js';
import { runHttpProbe } from './http.probe.js';
import { runTcpProbe } from './tcp.probe.js';

const runners = { HTTP: runHttpProbe, TCP: runTcpProbe, DNS: runDnsProbe };

export async function executeProbe(monitor) {
  const runner = runners[monitor.type];
  if (!runner) throw new Error(`Unsupported monitor type: ${monitor.type}`);
  return runner(monitor);
}
