import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { NearbyArea, NearbyResult } from '../models';

export type GeoState = 'idle' | 'asking' | 'ok' | 'denied' | 'unsupported' | 'error';
export interface RecentSearch { kind: 'area' | 'near' | 'city'; label: string; city: string; area: string; ts: number; }

const RECENT_KEY = 'ec.recent.v1';
const CENTER_KEY = 'ec.nearby.center.v1';

function read<T>(storage: 'local' | 'session', key: string, fallback: T): T {
  try {
    const raw = (storage === 'local' ? localStorage : sessionStorage).getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}
function write(storage: 'local' | 'session', key: string, value: unknown) {
  try { (storage === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

/** Shared state for "Nearby areas" / "Search near me" (home section + /nearby page). */
@Injectable({ providedIn: 'root' })
export class NearbyService {
  private api = inject(ApiService);
  private ticket = 0;

  readonly data = signal<NearbyResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly geo = signal<GeoState>('idle');
  /** the centre the visitor chose: a GPS fix or a locality */
  readonly gps = signal<{ lat: number; lng: number } | null>(read('session', CENTER_KEY, null));
  readonly pickedArea = signal<{ name: string; city: string } | null>(null);
  readonly radius = signal<number | null>(null);
  readonly recent = signal<RecentSearch[]>(read('local', RECENT_KEY, []));

  readonly areas = computed<NearbyArea[]>(() => this.data()?.areas ?? []);
  readonly origin = computed(() => this.data()?.origin ?? null);
  readonly hasCentre = computed(() => !!this.origin());
  readonly label = computed(() => {
    const o = this.origin();
    if (o) return o.label;
    return '';
  });

  /** Load once (popular areas) — or again if forced / the centre changed. */
  ensure() { if (!this.data() && !this.loading()) this.fetch(); }

  fetch() {
    const id = ++this.ticket;
    this.loading.set(true);
    this.error.set('');
    const g = this.gps(), a = this.pickedArea();
    this.api.nearbyAreas({
      lat: g?.lat, lng: g?.lng,
      area: !g ? a?.name : undefined, city: !g ? a?.city : undefined,
      radius: this.radius(), limit: 40, propLimit: 12
    }).subscribe({
      next: r => {
        if (id !== this.ticket) return;
        this.data.set(r); this.loading.set(false);
        if (g && r.origin && !r.outsideServiceArea) this.remember({ kind: 'near', label: r.origin.label, city: '', area: '' });
      },
      error: e => { if (id !== this.ticket) return; this.error.set(e?.message || 'Could not load nearby areas.'); this.loading.set(false); }
    });
  }

  /** Ask the browser for the visitor's position, then load the areas around it. */
  locate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { this.geo.set('unsupported'); return; }
    this.geo.set('asking');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) };
        this.gps.set(c); write('session', CENTER_KEY, c);
        this.pickedArea.set(null);
        this.geo.set('ok');
        this.fetch();
      },
      err => this.geo.set(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  }

  /** Use a locality as the centre instead of GPS. */
  pickArea(name: string, city: string) {
    this.gps.set(null); write('session', CENTER_KEY, null);
    this.pickedArea.set(name ? { name, city } : null);
    this.geo.set('idle');
    this.fetch();
  }

  setRadius(km: number | null) { this.radius.set(km); this.fetch(); }

  clearCentre() { this.gps.set(null); write('session', CENTER_KEY, null); this.pickedArea.set(null); this.geo.set('idle'); this.radius.set(null); this.fetch(); }

  remember(r: Omit<RecentSearch, 'ts'>) {
    const list = [{ ...r, ts: Date.now() }, ...this.recent().filter(x => !(x.kind === r.kind && x.area === r.area && x.city === r.city))].slice(0, 6);
    this.recent.set(list); write('local', RECENT_KEY, list);
  }
  forgetRecent() { this.recent.set([]); write('local', RECENT_KEY, []); }
}
