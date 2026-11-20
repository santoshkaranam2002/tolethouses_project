import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { FavoritesService } from '../core/services/favorites.service';
import { Property } from '../core/models';
import { Icon } from '../core/ui/icon';
import { Card } from '../shared/property-card';
import { CardSkeleton } from '../shared/card-skeleton';

@Component({
  selector: 'ec-saved', standalone: true, imports: [RouterLink, Icon, Card, CardSkeleton],
  template: `
  <section class="top"><div class="wrap"><span class="eyebrow">Your shortlist</span><h1 class="display">Saved homes</h1>
    <p class="muted">{{favs.count() ? favs.count() + ' home' + (favs.count() === 1 ? '' : 's') + ' saved on this device' : 'Tap the heart on any home to keep it here.'}}</p></div></section>
  <div class="wrap body">
    @if (error()) {
      <div class="state"><ec-icon name="alert" [size]="34"/><h3>Couldn’t load your saved homes</h3><p>{{error()}}</p><button class="btn" (click)="load()">Try again</button></div>
    } @else if (loading()) {
      <div class="g">@for (i of [1,2,3]; track i) { <ec-card-skeleton /> }</div>
    } @else if (!visible().length) {
      <div class="state"><ec-icon name="heart" [size]="38"/><h3>Nothing saved yet</h3><p>Browse homes and tap the heart to build your shortlist — we’ll keep it here for you.</p><a routerLink="/homes" class="btn ember">Browse homes</a></div>
    } @else {
      <div class="g">@for (p of visible(); track p.id; let i = $index) { <div class="cell" [style.--i]="i"><ec-card [p]="p"/></div> }</div>
    }
  </div>`,
  styles: [`.top{padding:48px 0 30px;background:linear-gradient(180deg,var(--sand),var(--paper))}.top .eyebrow{margin-bottom:14px}.top p{margin-top:12px}
  .body{padding-top:20px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:26px}
  .cell{animation:cin .7s var(--ease) both;animation-delay:calc(var(--i)*60ms)}@keyframes cin{from{opacity:0;transform:translateY(24px)}}
  .state{background:var(--sand);border-radius:var(--r-lg);padding:70px 20px;display:grid;justify-items:center;gap:10px;text-align:center;color:var(--ink-3)}.state h3{color:var(--ink);font-size:28px}.state ec-icon{color:var(--ember)}.state .btn{margin-top:10px}.state p{max-width:420px}
  @media(max-width:700px){.g{grid-template-columns:1fr}}`]
})
export class Saved {
  private api = inject(ApiService);
  favs = inject(FavoritesService);
  items = signal<Property[]>([]);
  loading = signal(true);
  error = signal('');
  private loadedFor = '';
  // un-saving a card removes it immediately without another request
  visible = computed(() => this.items().filter(p => this.favs.ids().includes(p.id)));

  constructor() {
    effect(() => {
      const key = [...this.favs.ids()].sort().join(',');
      const missing = this.favs.ids().some(id => !this.items().some(p => p.id === id));
      if (missing && key !== this.loadedFor) this.load();
      else if (!this.favs.ids().length) this.loading.set(false);
    });
  }
  load() {
    const ids = this.favs.ids();
    this.loadedFor = [...ids].sort().join(',');
    if (!ids.length) { this.items.set([]); this.loading.set(false); return; }
    this.loading.set(true); this.error.set('');
    this.api.propertiesByIds(ids).subscribe({
      next: r => { this.items.set(r); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); }
    });
  }
}
