import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const P: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  bed: '<path d="M3 18V7"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
  bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z"/><path d="M6 12V6a2 2 0 0 1 3.5-1.3"/><path d="m7 19-1 2M17 19l1 2"/>',
  area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
  share: '<circle cx="6" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="m8.2 10.9 7.1-3.8M8.2 13.1l7.1 3.8"/>',
  phone: '<path d="M5 4h4l1.6 4-2.2 1.4a11 11 0 0 0 5.2 5.2L15 12.4 19 14v4a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  chevL: '<path d="m15 5-7 7 7 7"/>', chevR: '<path d="m9 5 7 7-7 7"/>', chevD: '<path d="m5 9 7 7 7-7"/>',
  arrowR: '<path d="M4 12h16M14 6l6 6-6 6"/>', arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  home: '<path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l3 3"/>',
  sofa: '<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3v-5Z"/><path d="M6 18v2M18 18v2"/>',
  villa: '<path d="m3 12 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/><path d="M16 5v3"/>',
  suite: '<path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 7V5M10 5h4"/><path d="M3 20h18"/>',
  tolet: '<path d="M5 4h14v9H5z"/><path d="M12 13v8M9 21h6M8 8h8"/>',
  sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  car: '<path d="M5 16v-4l2-5h10l2 5v4"/><path d="M3 16h18v3H3z"/>',
  lift: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m9 10 3-3 3 3M9 14l3 3 3-3"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>',
  drop: '<path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  cctv: '<path d="m3 8 12-3 2 6-12 3z"/><path d="m17 9 4 1v4l-4-1M9 15v5"/>',
  dumbbell: '<path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12"/>',
  pool: '<path d="M3 17c2 0 2 1.5 4.5 1.500S10 17 12 17s2.5 1.5 4.5 1.500S19 17 21 17"/><path d="M8 14V6a2 2 0 0 1 4 0M14 14V6a2 2 0 0 1 4 0M8 9h6"/>',
  tree: '<path d="M12 21v-6"/><path d="M12 3c4 2 6 5 5 8-1 2-3 3-5 3s-4-1-5-3c-1-3 1-6 5-8Z"/>',
  wifi: '<path d="M3 9a14 14 0 0 1 18 0M6 12.500a9.5 9.5 0 0 1 12 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r=".9"/>',
  snow: '<path d="M12 3v18M4 7.500l16 9M20 7.500l-16 9"/>',
  camera: '<path d="M4 8h3l1.5-2.500h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  logout: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
  trash: '<path d="M5 7h14M10 4h4M7 7l1 13h8l1-13M10 11v6M14 11v6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.100L12 17l-5.4 2.9 1-6.100L3.2 9.500l6.1-.9L12 3Z"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  inbox: '<path d="m4 13 2-8h12l2 8v6H4v-6Z"/><path d="M4 13h5l1 2h4l1-2h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17v.5"/>',
  dash: '<rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>',
  locate: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  navigate: '<path d="M3 11l18-8-8 18-2-8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
};
const FILLABLE = new Set(['heart', 'star']);

@Component({
  selector: 'ec-icon', standalone: true,
  template: `<svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" [attr.fill]="fill() && fillable() ? 'currentColor' : 'none'" stroke="currentColor" [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" [innerHTML]="html()"></svg>`,
  styles: [`:host{display:inline-flex;line-height:0;flex:none}svg{display:block}`]
})
export class Icon {
  name = input.required<string>();
  size = input(20);
  stroke = input(1.8);
  fill = input(false);
  private san = inject(DomSanitizer);
  html = computed(() => this.san.bypassSecurityTrustHtml(P[this.name()] ?? ''));
  fillable = computed(() => FILLABLE.has(this.name()));
}

export const AMENITY_ICON: Record<string, string> = {
  'Parking': 'car', 'Lift': 'lift', 'Power Backup': 'bolt', '24x7 Water': 'drop', 'Security': 'shield', 'CCTV': 'cctv',
  'Gym': 'dumbbell', 'Swimming Pool': 'pool', 'Play Area': 'star', 'Clubhouse': 'users', 'Garden': 'tree', 'Terrace': 'sun',
  'Air Conditioning': 'snow', 'Modular Kitchen': 'home', 'Wi-Fi': 'wifi', 'Housekeeping': 'sparkles', 'Gated Community': 'lock', 'Pet Friendly': 'heart'
};
export const CATEGORY_ICON: Record<string, string> = {
  'to-let': 'tolet', 'rental-house': 'key', 'individual-house': 'villa', 'flat-apartment': 'building', 'service-apartment': 'suite'
};
