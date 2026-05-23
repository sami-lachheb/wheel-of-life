/**
 * API base URL for browser requests.
 * In Docker dev, do not use internal hostnames (e.g. backend:8000) — use the Vite /api proxy.
 */
export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_URL || '';
  if (env && !env.includes('backend:')) {
    return `${env.replace(/\/$/, '')}/api`;
  }
  return '/api';
}

/** WebSocket URL for Hayat Live coach (proxied via Vite in dev). */
export function getCoachLiveWsUrl() {
  const token = localStorage.getItem('token') || '';
  const env = import.meta.env.VITE_API_URL || '';

  if (env && !env.includes('backend:')) {
    const wsBase = env.replace(/^http/, 'ws').replace(/\/$/, '');
    return `${wsBase}/api/coach/live?token=${encodeURIComponent(token)}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/coach/live?token=${encodeURIComponent(token)}`;
}
