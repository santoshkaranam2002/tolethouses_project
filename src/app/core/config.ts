declare global { interface Window { EC_CONFIG?: { apiUrl?: string } } }

const LIVE_API = 'http://estatecraft-env.eba-48mmcste.us-east-2.elasticbeanstalk.com/api';

/** Where the API lives. Priority: public/config.js (runtime) → live API. */
export function apiBase(): string {
  const configured = window.EC_CONFIG?.apiUrl?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return LIVE_API;
}