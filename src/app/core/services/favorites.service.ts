import { Injectable, computed, signal } from '@angular/core';

const KEY = 'ec.saved';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  readonly ids = signal<number[]>(this.read());
  readonly count = computed(() => this.ids().length);

  private read(): number[] {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(n => Number.isInteger(n)) : []; }
    catch { return []; }
  }
  has(id: number) { return this.ids().includes(id); }
  toggle(id: number): boolean {
    const next = this.has(id) ? this.ids().filter(i => i !== id) : [...this.ids(), id];
    this.ids.set(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next.includes(id);
  }
}
