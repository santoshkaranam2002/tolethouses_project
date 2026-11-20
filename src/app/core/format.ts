import { Property } from './models';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function rupees(n: number): string { return '₹' + inr.format(Math.round(n || 0)); }

/** Short form for tight spaces: 9500 -> ₹9,500 · 125000 -> ₹1.25 L */
export function rupeesShort(n: number): string {
  if (n >= 10000000) return '₹' + +(n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return '₹' + +(n / 100000).toFixed(2) + ' L';
  return rupees(n);
}

export function unitOf(p: Pick<Property, 'priceUnit'>): string { return (p.priceUnit || '/month').replace('/', '/ '); }

/** Plain neutral picture shown wherever a listing has no photo yet. */
export function placeholderArt(_seed: string | number = '', _label = ''): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#ece8e1"/><path d="M300 360V270l100-70 100 70v90z" fill="none" stroke="#b9b2a6" stroke-width="10" stroke-linejoin="round"/><rect x="375" y="300" width="50" height="60" fill="#b9b2a6"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function waLink(phone: string, text: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const num = digits.length === 10 ? '91' + digits : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
