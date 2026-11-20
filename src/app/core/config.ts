declare global { interface Window { EC_CONFIG?: { apiUrl?: string } } }

const LIVE_API = 'https://cu2ikj4kvl.execute-api.ap-northeast-1.amazonaws.com/api';

/** Where the API lives. Priority: public/config.js (runtime) → live API. */
export function apiBase(): string {
  const configured = window.EC_CONFIG?.apiUrl?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return LIVE_API;
}