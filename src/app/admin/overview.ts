import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { MetaService } from '../core/services/meta.service';
import { AuthService } from '../core/services/auth.service';
import { Enquiry } from '../core/models';
import { CATEGORY_ICON, Icon } from '../core/ui/icon';
import { CountDirective } from '../core/directives/motion';
import { ADMIN_CSS } from './admin-css';

@Component({
  selector: 'ec-overview', standalone: true, imports: [RouterLink, Icon, CountDirective],
  template: `
  <div class="ph"><div><h1>Good to see you, {{first()}}.</h1><p>Here’s how EstateCraft is doing today.</p></div>
    <a routerLink="/admin/properties" [queryParams]="{add: 1}" class="btn ember"><ec-icon name="plus" [size]="18"/> Add property</a></div>

  @if (error()) { <div class="errbar"><ec-icon name="alert" [size]="18"/> {{error()}} <button (click)="load()">Retry</button></div> }

  <div class="stats">
    @for (s of cards(); track s.l; let i = $index) {
      <a class="stat" [routerLink]="s.to" [style.--i]="i"><span class="si {{s.c}}"><ec-icon [name]="s.i" [size]="22"/></span>
        <b>@if (stats()) { <span [appCount]="s.v">{{s.v}}</span> } @else { <span class="skel sk"></span> }</b><small>{{s.l}}</small></a>
    }
  </div>

  <div class="two">
    <section class="panel">
      <h3>Homes by type</h3>
      @if (!stats()) { <div class="skrows">@for (i of [1,2,3,4,5]; track i) { <div class="skel"></div> }</div> }
      @else { <div class="bars">@for (c of meta.categories(); track c.key) {
        <div class="bar"><span class="bl"><ec-icon [name]="icons[c.key]" [size]="17"/> {{c.label}}</span><span class="bt"><i [style.width.%]="pct(c.key)"></i></span><b>{{by(c.key)}}</b></div>
      }</div> }
    </section>
    <section class="panel">
      <div class="sh"><h3>Latest enquiries</h3><a routerLink="/admin/enquiries" class="lnk">View all</a></div>
      @if (!recent()) { <div class="skrows">@for (i of [1,2,3]; track i) { <div class="skel"></div> }</div> }
      @else if (!recent()!.length) { <div class="empty"><ec-icon name="inbox" [size]="30"/><p>No enquiries yet.</p></div> }
      @else { <ul class="rec">@for (e of recent()!; track e.id) { <li><span class="av">{{e.name.charAt(0)}}</span><div><b>{{e.name}}</b><small>{{e.propertyTitle}}</small></div><span class="st" [class.info]="e.status==='New'">{{e.status}}</span></li> }</ul> }
    </section>
  </div>`,
  styles: [ADMIN_CSS + `
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:22px}
  .stat{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:20px;display:grid;gap:4px;transition:all .4s var(--ease);animation:pagein .6s var(--ease) both;animation-delay:calc(var(--i)*60ms)}.stat:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
  .si{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;margin-bottom:10px;background:var(--sand)}.si.a{background:#fbe7c4;color:#8a5a10}.si.b{background:#d9f3e8;color:#0b6b52}.si.c{background:#e1ecf8;color:#1d4f86}.si.d{background:#fde2dc;color:#a22a18}.si.e{background:#efe3fa;color:#5d33a0}
  .stat b{font-family:var(--font-display);font-size:38px;font-weight:600;line-height:1}.sk{display:block;height:34px;width:60px}.stat small{color:var(--ink-3)}
  .two{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}.panel h3{font-size:24px;margin-bottom:18px}.sh{display:flex;justify-content:space-between;align-items:baseline}.lnk{color:var(--ember);font-weight:700;font-size:14px}
  .bars{display:grid;gap:14px}.bar{display:grid;grid-template-columns:190px 1fr 34px;gap:14px;align-items:center}.bl{display:flex;gap:8px;align-items:center;font-weight:600;font-size:14.5px}.bl ec-icon{color:var(--ember)}
  .bt{height:10px;background:var(--sand);border-radius:99px;overflow:hidden}.bt i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--ember));border-radius:99px;transition:width 1.2s var(--ease)}.bar b{text-align:right}
  .rec{list-style:none;padding:0;margin:0;display:grid;gap:4px}.rec li{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px dashed var(--line)}.rec li:last-child{border:0}.rec div{flex:1;min-width:0}.rec b{display:block}.rec small{color:var(--ink-3);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .av{width:40px;height:40px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font-weight:700;font-family:var(--font-display);flex:none}
  @media(max-width:900px){.two{grid-template-columns:1fr}.bar{grid-template-columns:150px 1fr 30px}}@media(max-width:480px){.bar{grid-template-columns:1fr 30px}.bt{grid-column:1/-1;order:3}}`]
})
export class Overview implements OnInit {
  private api = inject(ApiService);
  meta = inject(MetaService);
  auth = inject(AuthService);
  icons = CATEGORY_ICON;
  stats = signal<Record<string, any> | null>(null);
  recent = signal<Enquiry[] | null>(null);
  error = signal('');
  first = computed(() => (this.auth.user()?.name || 'there').split(' ')[0]);
  cards = computed(() => {
    const s = this.stats() ?? {};
    return [
      { l: 'Total properties', v: s['properties'] ?? 0, i: 'home', c: 'a', to: '/admin/properties' },
      { l: 'Available now', v: s['available'] ?? 0, i: 'check', c: 'b', to: '/admin/properties' },
      { l: 'Rented', v: s['rented'] ?? 0, i: 'key', c: 'c', to: '/admin/properties' },
      { l: 'New enquiries', v: s['newEnquiries'] ?? 0, i: 'inbox', c: 'd', to: '/admin/enquiries' },
      { l: 'Customers', v: s['customers'] ?? 0, i: 'users', c: 'e', to: '/admin/customers' },
    ];
  });
  ngOnInit() { this.meta.load(); this.load(); }
  load() {
    this.error.set('');
    forkJoin({ s: this.api.stats(), e: this.api.enquiries() }).subscribe({
      next: ({ s, e }) => { this.stats.set(s); this.recent.set(e.slice(0, 5)); },
      error: e => this.error.set(e.message)
    });
  }
  by(k: string): number { return this.stats()?.['byCategory']?.[k] ?? 0; }
  pct(k: string) { const t = Math.max(1, ...Object.values<number>(this.stats()?.['byCategory'] ?? { x: 1 })); return (this.by(k) / t) * 100; }
}
