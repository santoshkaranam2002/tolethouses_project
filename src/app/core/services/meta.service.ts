import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Meta } from '../models';

/** Loads categories / cities / amenities ONCE and shares them app-wide. */
@Injectable({ providedIn: 'root' })
export class MetaService {
  private api = inject(ApiService);
  readonly meta = signal<Meta | null>(null);
  readonly failed = signal(false);
  private loading = false;

  readonly categories = computed(() => this.meta()?.categories ?? []);
  readonly cities = computed(() => this.meta()?.cities ?? []);
  readonly amenities = computed(() => this.meta()?.amenities ?? []);
  readonly furnishing = computed(() => this.meta()?.furnishing ?? ['Unfurnished', 'Semi-Furnished', 'Fully Furnished']);

  load(force = false) {
    if (this.loading || (this.meta() && !force)) return;
    this.loading = true;
    this.failed.set(false);
    this.api.meta().subscribe({
      next: m => { this.meta.set(m); this.loading = false; },
      error: () => { this.failed.set(true); this.loading = false; }
    });
  }
  categoryLabel(key: string) { return this.categories().find(c => c.key === key)?.label ?? key; }
  areasOf(city: string): string[] { return this.cities().find(c => c.name === city)?.areas ?? []; }
}
