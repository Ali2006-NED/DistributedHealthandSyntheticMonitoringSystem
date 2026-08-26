export function evaluateAssertions(response, assertions = []) {
  return assertions.every((assertion) => {
    if (assertion.type === 'status') return response.status === assertion.expected;
    if (assertion.type === 'contains') return response.body.includes(assertion.value);
    if (assertion.type === 'json') return getPath(response.json, assertion.path) === assertion.expected;
    if (assertion.type === 'max-latency') return response.latencyMs <= assertion.maxMs;
    return false;
  });
}

function getPath(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value);
}
