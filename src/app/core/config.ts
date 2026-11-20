declare global { interface Window { EC_CONFIG?: { apiUrl?: string } } }

/** Where the API lives. Priority: public/config.js (runtime) → localhost dev default → same-origin /api. */
export function apiBase(): string {
  const configured = window.EC_CONFIG?.apiUrl?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : '/api';
}
