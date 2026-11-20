import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, tap, catchError, of, map } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { MetaService } from '../core/services/meta.service';
import { Paged, Property, SearchFilters } from '../core/models';
import { Icon, CATEGORY_ICON } from '../core/ui/icon';
import { BUDGETS, SORTS, budgetOf } from '../core/filters';
import { Card } from '../shared/property-card';
import { CardSkeleton } from '../shared/card-skeleton';

const PAGE_SIZE = 12;

@Component({
  selector: 'ec-search', standalone: true,
  imports: [FormsModule, Icon, Card, CardSkeleton],
  template: `
  <section class="top">
    <div class="wrap">
      <span class="eyebrow">Search</span>
      <h1 class="display">{{heading()}}</h1>
      <p class="sub">@if (data()) { <b>{{data()!.total}}</b> {{data()!.total === 1 ? 'home' : 'homes'}} match your search } @else { Looking for homes… }</p>
    </div>
  </section>

  <div class="bar" [class.stuck]="true">
    <div class="wrap">
      <div class="r1">
        <label class="q"><ec-icon name="search" [size]="20"/>
          <input type="search" placeholder="Search by area, street or keyword" [ngModel]="qText()" (ngModelChange)="onQ($event)" aria-label="Search homes"/>
          @if (qText()) { <button type="button" (click)="onQ(''); set({q: null})" aria-label="Clear search"><ec-icon name="close" [size]="16"/></button> }
        </label>
        <button class="btn ghost fbtn" (click)="sheet.set(true)"><ec-icon name="filter" [size]="18"/> Filters @if (activeCount()) { <i>{{activeCount()}}</i> }</button>
        <select class="select sortsel" [ngModel]="f().sort || ''" (ngModelChange)="set({sort: $event})" aria-label="Sort homes">
          @for (s of sorts; track s.id) { <option [value]="s.id">{{s.label}}</option> }
        </select>
      </div>
      <div class="cats" role="tablist" aria-label="Property type">
        <button role="tab" [class.on]="!f().category" (click)="set({category: null})"><ec-icon name="grid" [size]="17"/> All types</button>
        @for (c of meta.categories(); track c.key) {
          <button role="tab" [class.on]="f().category === c.key" (click)="set({category: c.key})"><ec-icon [name]="icons[c.key]" [size]="17"/> {{c.short}} <small>{{c.count}}</small></button>
        }
      </div>
    </div>
  </div>

  <!-- filter panel: inline row on desktop, bottom sheet on mobile -->
  <div class="scrim" [class.open]="sheet()" (click)="sheet.set(false)"></div>
  <aside class="panel" [class.open]="sheet()" aria-label="Filters">
    <div class="ph"><h3>Filters</h3><button class="icon-btn" (click)="sheet.set(false)" aria-label="Close filters"><ec-icon name="close" [size]="22"/></button></div>
    <div class="grid">
      <label class="field"><span>City</span>
        <select class="select" [ngModel]="f().city || ''" (ngModelChange)="set({city: $event, area: null})"><option value="">All cities</option>@for (c of meta.cities(); track c.id) { <option [value]="c.name">{{c.name}}</option> }</select></label>
      <label class="field"><span>Locality</span>
        <select class="select" [ngModel]="f().area || ''" (ngModelChange)="set({area: $event})"><option value="">Any locality</option>@for (a of areaOptions(); track a) { <option [value]="a">{{a}}</option> }</select></label>
      <label class="field"><span>Monthly budget</span>
        <select class="select" [ngModel]="budget()" (ngModelChange)="setBudget($event)">@for (b of budgets; track b.id) { <option [value]="b.id">{{b.label}}</option> }</select></label>
      <label class="field"><span>Furnishing</span>
        <select class="select" [ngModel]="f().furnishing || ''" (ngModelChange)="set({furnishing: $event})"><option value="">Any</option>@for (x of meta.furnishing(); track x) { <option [value]="x">{{x}}</option> }</select></label>
      <div class="field wide"><span>Bedrooms</span>
        <div class="seg">@for (b of bedOpts; track b.v) { <button type="button" [class.on]="(f().beds || '') === b.v" (click)="set({beds: b.v})">{{b.l}}</button> }</div></div>
    </div>
    <div class="pf"><button class="btn ghost" (click)="clearAll()">Clear all</button><button class="btn ember" (click)="sheet.set(false)">Show {{data()?.total ?? ''}} homes</button></div>
  </aside>

  <div class="wrap res">
    @if (chips().length) {
      <div class="chips" aria-label="Active filters">
        @for (c of chips(); track c.key) { <button class="chip" (click)="c.clear()">{{c.label}} <ec-icon name="close" [size]="13"/></button> }
        <button class="clear" (click)="clearAll()">Clear all</button>
      </div>
    }

    @if (error()) {
      <div class="state"><ec-icon name="alert" [size]="34"/><h3>Couldn’t load homes</h3><p>{{error()}}</p><button class="btn" (click)="refetch()">Try again</button></div>
    } @else if (!data()) {
      <div class="gridc">@for (i of skels; track i) { <ec-card-skeleton /> }</div>
    } @else if (!data()!.items.length) {
      <div class="state"><ec-icon name="search" [size]="34"/><h3>No homes match these filters</h3><p>Try a wider budget, a different locality, or clear a filter or two.</p><button class="btn ember" (click)="clearAll()">Clear all filters</button></div>
    } @else {
      <div class="gridc" [class.busy]="busy()">
        @for (p of data()!.items; track p.id; let i = $index) { <div class="cell" [style.--i]="i"><ec-card [p]="p"/></div> }
      </div>
      @if (data()!.pages > 1) {
        <nav class="pager" aria-label="Pagination">
          <button class="pg arrow" [disabled]="data()!.page <= 1" (click)="goPage(data()!.page - 1)" aria-label="Previous page"><ec-icon name="chevL" [size]="18"/></button>
          @for (n of pageList(); track $index) {
            @if (n === 0) { <span class="dots">…</span> } @else { <button class="pg" [class.on]="n === data()!.page" (click)="goPage(n)" [attr.aria-current]="n === data()!.page ? 'page' : null">{{n}}</button> }
          }
          <button class="pg arrow" [disabled]="data()!.page >= data()!.pages" (click)="goPage(data()!.page + 1)" aria-label="Next page"><ec-icon name="chevR" [size]="18"/></button>
        </nav>
        <p class="range">Showing {{(data()!.page - 1) * data()!.pageSize + 1}}–{{min(data()!.page * data()!.pageSize, data()!.total)}} of {{data()!.total}}</p>
      }
    }
  </div>
  `,
  styles: [`
  :host{display:block}
  .top{padding:44px 0 26px;background:linear-gradient(180deg,var(--sand),var(--paper))}
  .top .eyebrow{margin-bottom:14px}.top .display{font-size:clamp(32px,4.6vw,54px)}.sub{color:var(--ink-3);margin-top:12px}.sub b{color:var(--ink)}
  .bar{position:sticky;top:var(--nav-h);z-index:50;background:rgba(255,255,255,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--line);padding:12px 0 8px}
  .r1{display:flex;gap:10px;align-items:center}
  .q{flex:1;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:0 8px 0 18px;min-height:50px;transition:all .25s;min-width:0}
  .q:focus-within{border-color:var(--ember);box-shadow:0 0 0 4px rgba(226,85,45,.13)}
  .q input{flex:1;border:0;outline:0;background:transparent;font-size:16px;min-width:0}.q button{width:34px;height:34px;border-radius:50%;display:grid;place-items:center}.q button:hover{background:var(--sand)}
  .fbtn{min-height:50px;position:relative}.fbtn i{font-style:normal;background:var(--ember);color:#fff;border-radius:99px;font-size:11px;min-width:20px;height:20px;display:grid;place-items:center;font-weight:700}
  .sortsel{width:210px;min-height:50px;border-radius:999px;padding-left:18px;font-weight:600}
  .cats{display:flex;gap:8px;overflow-x:auto;padding:12px 2px 4px;scrollbar-width:none}.cats::-webkit-scrollbar{display:none}
  .cats button{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;border:1.5px solid var(--line);background:#fff;font-weight:600;font-size:14px;white-space:nowrap;color:var(--ink-2);transition:all .3s var(--ease)}
  .cats button:hover{border-color:var(--ink);transform:translateY(-2px)}
  .cats button.on{background:var(--ink);color:#fff;border-color:var(--ink)}.cats small{opacity:.6;font-weight:600}

  .scrim{position:fixed;inset:0;background:rgba(16,26,43,.5);z-index:210;opacity:0;visibility:hidden;transition:opacity .35s,visibility 0s .35s;backdrop-filter:blur(3px)}.scrim.open{opacity:1;visibility:visible;transition:opacity .35s}
  .panel{position:fixed;z-index:220;left:50%;top:50%;width:min(720px,calc(100vw - 32px));max-height:88vh;overflow:auto;background:#fff;border-radius:28px;padding:24px 26px 22px;box-shadow:var(--shadow-lg);transform:translate(-50%,-46%) scale(.96);opacity:0;visibility:hidden;transition:all .4s var(--ease),visibility 0s .4s}
  .panel.open{transform:translate(-50%,-50%);opacity:1;visibility:visible;transition:all .4s var(--ease)}
  .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.ph h3{font-size:28px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.wide{grid-column:1/-1}
  .seg{display:flex;gap:6px;flex-wrap:wrap}.seg button{padding:11px 20px;border-radius:999px;border:1.5px solid var(--line);font-weight:600;transition:all .25s}.seg button:hover{border-color:var(--ink)}.seg button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
  .pf{display:flex;justify-content:space-between;gap:10px;margin-top:22px}.pf .ember{flex:1}

  .res{padding-top:26px}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;align-items:center}
  .chips .chip{background:#fff;border:1.5px solid var(--line);padding:7px 12px;transition:all .25s;animation:pagein .35s var(--ease)}.chips .chip:hover{border-color:var(--ember);color:var(--ember)}
  .clear{font-weight:600;font-size:14px;color:var(--ember);padding:7px 8px;text-decoration:underline;text-underline-offset:3px}
  .gridc{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:26px;transition:opacity .3s}.gridc.busy{opacity:.5;pointer-events:none}
  .cell{animation:cin .7s var(--ease) both;animation-delay:calc(var(--i) * 55ms)}
  @keyframes cin{from{opacity:0;transform:translateY(26px) scale(.97)}}
  .state{background:var(--sand);border-radius:var(--r-lg);padding:64px 20px;display:grid;justify-items:center;gap:10px;text-align:center;color:var(--ink-3);margin:20px 0}.state h3{color:var(--ink);font-size:28px}.state ec-icon{color:var(--ember)}.state p{max-width:420px}.state .btn{margin-top:10px}
  .pager{display:flex;justify-content:center;gap:8px;margin-top:50px;align-items:center;flex-wrap:wrap}
  .pg{min-width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:600;border:1.5px solid var(--line);background:#fff;transition:all .3s var(--ease)}.pg:hover:not([disabled]){border-color:var(--ink);transform:translateY(-2px)}.pg.on{background:var(--ink);color:#fff;border-color:var(--ink)}.pg[disabled]{opacity:.35;cursor:not-allowed}.dots{color:var(--mute);padding:0 4px}
  .range{text-align:center;color:var(--ink-3);font-size:14px;margin-top:14px}

  @media(max-width:700px){
    .bar{top:var(--nav-h)}.sortsel{display:none}.fbtn{padding:0 18px}
    .panel{left:0;right:0;top:auto;bottom:0;width:100%;max-height:90vh;border-radius:28px 28px 0 0;transform:translateY(100%);padding-bottom:calc(22px + env(safe-area-inset-bottom))}
    .panel.open{transform:none}.grid{grid-template-columns:1fr}
    .gridc{grid-template-columns:1fr;gap:20px}
  }
  `]
})
export class Search implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  meta = inject(MetaService);
  icons = CATEGORY_ICON;
  budgets = BUDGETS; sorts = SORTS;
  bedOpts = [{ v: '', l: 'Any' }, { v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3' }, { v: '4', l: '4+' }];
  skels = [1, 2, 3, 4, 5, 6];
  min = Math.min;

  f = signal<SearchFilters>({});
  data = signal<Paged<Property> | null>(null);
  busy = signal(false);
  error = signal('');
  sheet = signal(false);
  qText = signal('');
  private q$ = new Subject<string>();

  budget = computed(() => budgetOf(this.f().minPrice, this.f().maxPrice));
  areaOptions = computed(() => {
    const city = this.f().city;
    if (city) return this.meta.areasOf(city);
    return this.meta.cities().flatMap(c => c.areas);
  });
  heading = computed(() => {
    const f = this.f();
    const cat = f.category ? this.meta.categoryLabel(f.category) : 'Homes';
    const place = f.area ? `${f.area}, ${f.city || this.meta.cities()[0]?.name || ''}` : (f.city || this.meta.cities()[0]?.name || '');
    return `${cat} for rent${place ? ' in ' + place : ''}`;
  });
  activeCount = computed(() => this.chips().length);
  chips = computed(() => {
    const f = this.f(); const out: { key: string; label: string; clear: () => void }[] = [];
    if (f.q) out.push({ key: 'q', label: `“${f.q}”`, clear: () => { this.qText.set(''); this.set({ q: null }); } });
    if (f.city) out.push({ key: 'city', label: f.city, clear: () => this.set({ city: null, area: null }) });
    if (f.area) out.push({ key: 'area', label: f.area, clear: () => this.set({ area: null }) });
    const b = BUDGETS.find(x => x.id === this.budget());
    if (b && b.id) out.push({ key: 'b', label: b.label, clear: () => this.setBudget('') });
    else if (f.minPrice || f.maxPrice) out.push({ key: 'b', label: `₹${f.minPrice || 0} – ${f.maxPrice ? '₹' + f.maxPrice : 'any'}`, clear: () => this.set({ minPrice: null, maxPrice: null }) });
    if (f.beds) out.push({ key: 'beds', label: f.beds === '4' ? '4+ bedrooms' : `${f.beds} bedroom${f.beds === '1' ? '' : 's'}`, clear: () => this.set({ beds: null }) });
    if (f.furnishing) out.push({ key: 'fu', label: f.furnishing, clear: () => this.set({ furnishing: null }) });
    return out;
  });
  pageList = computed(() => {
    const d = this.data(); if (!d) return [];
    const { page, pages } = d; const out: number[] = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - page) <= 1) out.push(i);
      else if (out[out.length - 1] !== 0) out.push(0);
    }
    return out;
  });

  constructor() {
    this.meta.load();
    // The URL is the single source of truth; every change in it triggers exactly one request,
    // and a newer request cancels any older one still in flight (no duplicate/stale responses).
    this.route.queryParams.pipe(
      map(p => p as SearchFilters),
      tap(p => { this.f.set(p); this.qText.set(p.q ?? ''); this.busy.set(!!this.data()); this.error.set(''); }),
      switchMap(p => this.api.properties(p as any, PAGE_SIZE).pipe(catchError(e => { this.error.set(e.message); return of(null); }))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(r => { this.busy.set(false); if (r) this.data.set(r); });

    this.q$.pipe(debounceTime(380), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.set({ q: v.trim() || null }));
  }
  ngOnInit() { /* data flows from queryParams in the constructor */ }

  onQ(v: string) { this.qText.set(v); this.q$.next(v); }

  set(patch: Record<string, string | null>) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { ...patch, page: null }, queryParamsHandling: 'merge' });
  }
  setBudget(id: string) {
    const b = BUDGETS.find(x => x.id === id);
    this.set({ minPrice: b?.min ?? null, maxPrice: b?.max ?? null });
  }
  clearAll() {
    this.qText.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: { category: this.f().category || null, q: null, city: null, area: null, minPrice: null, maxPrice: null, beds: null, furnishing: null, sort: null, page: null }, queryParamsHandling: 'merge' });
  }
  goPage(n: number) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { page: n > 1 ? n : null }, queryParamsHandling: 'merge' });
    window.scrollTo({ top: 220, behavior: 'smooth' });
  }
  refetch() {
    this.error.set(''); this.data.set(null);
    this.api.properties(this.f() as any, PAGE_SIZE).subscribe({ next: r => this.data.set(r), error: e => this.error.set(e.message) });
  }
}
