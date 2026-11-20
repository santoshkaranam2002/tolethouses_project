declare global { interface Window { EC_CONFIG?: { apiUrl?: string } } }

// Replace with your CloudFront address (must be https:// when the site is on https).
const LIVE_API = 'https://d1234abcd.cloudfront.net/api';

/** Where the API lives. Priority: public/config.js (runtime) → live API. */
export function apiBase(): string {
  const configured = window.EC_CONFIG?.apiUrl?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return LIVE_API;
}