import { API_BASE } from './config.js';

async function authFetch(path, options = {}, getToken) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status, data: err });
  }
  return res.json();
}

export function createApiClient(getToken) {
  return {
    search: category =>
      authFetch('/api/search', { method: 'POST', body: JSON.stringify({ category }) }, getToken),

    history: (limit = 20) =>
      authFetch(`/api/history?limit=${limit}`, {}, getToken),

    name: word =>
      authFetch(`/api/name/${encodeURIComponent(word)}`, {}, getToken),

    refresh: resultId =>
      authFetch(`/api/refresh/${resultId}`, { method: 'POST' }, getToken),
  };
}
