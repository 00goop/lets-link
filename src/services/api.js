export async function request(path, { body, method = body ? 'POST' : 'GET' } = {}) {
  const response = await fetch(`/api${path}`, { method, credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000) });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: response.status });
  return data;
}
