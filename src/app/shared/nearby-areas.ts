import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NearbyArea } from '../core/models';
import { NearbyService, RecentSearch } from '../core/services/nearby.service';
import { Icon, CATEGORY_ICON } from '../core/ui/icon';
import { Img } from '../core/ui/img';
import { RevealDirective } from '../core/directives/motion';
import { kmLabel, rupees } from '../core/format';

type Mode = '' | 'near' | 'most' | 'budget' | 'all';

/** Nearby areas: filter chips + interactive area cards + recent searches.
 *  Used on the home page (compact) and on /nearby. State lives in NearbyService. */
@Component({
  selector: 'ec-nearby', standalone: true,
  imports: [RouterLink, NgTemplateOutlet, Icon, Img, RevealDirective],
  template: `
  <section class="nb" [class.compact]="compact()">
    @if (compact()) {
      <div class="head" appReveal>
        <div>
          <span class="eyebrow">Search near me</span>
          <h2>Find homes in the areas around you</h2>
          <p class="sub">Tap an area to see its homes — or let us find what’s closest to where you are.</p>
        </div>
        <div class="acts">
          <button type="button" class="btn ember" (click)="svc.locate()" [disabled]="svc.geo() === 'asking'">
            @if (svc.geo() === 'asking') { <span class="spin"></span> Locating… } @else { <ec-icon name="locate" [size]="19"/> Near me }
          </button>
          <a class="btn ghost" routerLink="/nearby">All nearby areas <ec-icon name="arrowR" [size]="17"/></a>
        </div>
      </div>
    }

    @if (showRecent() && svc.recent().length) {
      <div class="recent" appReveal>
        <div class="rh"><h3>Recent searches</h3><button type="button" class="clear" (click)="svc.forgetRecent()">Clear</button></div>
        <div class="rrow">
          @for (r of svc.recent(); track r.ts) {
            @if (r.kind === 'near') {
              <a class="rc" routerLink="/nearby" [queryParams]="{near: 1}"><ng-container [ngTemplateOutlet]="rbody" [ngTemplateOutletContext]="{r: r}"/></a>
            } @else {
              <a class="rc" routerLink="/homes" [queryParams]="{city: r.city || null, area: r.area || null}"><ng-container [ngTemplateOutlet]="rbody" [ngTemplateOutletContext]="{r: r}"/></a>
            }
          }
        </div>
      </div>
    }

    <!-- status messages -->
    @switch (svc.geo()) {
      @case ('denied') { <div class="note warn" role="status"><ec-icon name="alert" [size]="18"/> Location access is blocked. Allow it in your browser settings, or choose a locality instead.</div> }
      @case ('unsupported') { <div class="note warn" role="status"><ec-icon name="alert" [size]="18"/> This browser can’t share your location. Choose a locality instead.</div> }
      @case ('error') { <div class="note warn" role="status"><ec-icon name="alert" [size]="18"/> We couldn’t get your location just now. Try again, or choose a locality.</div> }
    }
    @if (svc.data()?.outsideServiceArea) {
      <div class="note" role="status"><ec-icon name="globe" [size]="18"/> You’re outside the areas we cover today — here are the most popular ones. Pick a locality to see what’s near it.</div>
    }
    @if (svc.origin(); as o) {
      @if (!svc.data()?.outsideServiceArea) {
        <div class="note ok" role="status"><ec-icon name="navigate" [size]="17"/> <span class="t">@if (o.source === 'gps') { Showing areas around your location — closest is <b>{{svc.data()?.nearestArea}}</b> } @else { Showing areas near <b>{{o.label}}</b> }</span>
          <button type="button" class="x" (click)="svc.clearCentre()" aria-label="Clear location"><ec-icon name="close" [size]="14"/></button></div>
      }
    }

    <div class="bar">
      <h3 class="ttl">{{svc.hasCentre() && !svc.data()?.outsideServiceArea ? 'Areas near you' : 'Popular areas'}}</h3>
      <div class="chips" role="tablist" aria-label="Sort areas">
        @for (c of chips(); track c.id) {
          <button type="button" role="tab" [class.on]="mode() === c.id" [attr.aria-selected]="mode() === c.id" (click)="sort.set(c.id)">{{c.label}}</button>
        }
      </div>
    </div>

    @if (svc.loading() && !svc.areas().length) {
      <div class="tiles">@for (i of [1,2,3,4,5,6,7,8]; track i) { <div class="tile sk skel"></div> }</div>
    } @else if (svc.error() && !svc.areas().length) {
      <div class="state"><ec-icon name="alert" [size]="30"/><h3>We couldn’t load nearby areas</h3><p>{{svc.error()}}</p><button class="btn" (click)="svc.fetch()">Try again</button></div>
    } @else if (!shown().length) {
      <div class="state"><ec-icon name="pin" [size]="30"/><h3>No areas to show yet</h3><p>Areas appear here as soon as they’re added in Admin → Locations.</p></div>
    } @else {
      <div class="tiles" [class.busy]="svc.loading()">
        @for (a of shown(); track a.city + a.name; let i = $index) {
          <a class="tile" [class.empty]="!a.count" [style.--i]="i" [routerLink]="['/homes']" [queryParams]="{city: a.city, area: a.name}" (click)="remember(a)"
             [attr.aria-label]="a.name + ', ' + (a.count || 'no') + ' homes' + (a.distanceKm !== null ? ', ' + km(a.distanceKm) + ' away' : '')">
            <div class="pic">
              @if (a.cover) { <ec-img [src]="a.cover" [seed]="a.name" [label]="a.name" [alt]="a.name"/> }
              @else {
                <div class="art p{{hue(a.name)}}" aria-hidden="true">
                  <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice"><g fill="currentColor">
                    <rect x="8" y="64" width="26" height="56" rx="2"/><rect x="38" y="42" width="30" height="78" rx="2"/><rect x="72" y="74" width="22" height="46" rx="2"/>
                    <rect x="98" y="30" width="34" height="90" rx="2"/><rect x="136" y="58" width="24" height="62" rx="2"/><rect x="164" y="80" width="28" height="40" rx="2"/></g>
                    <g fill="rgba(255,255,255,.55)"><rect x="44" y="52" width="5" height="6"/><rect x="54" y="52" width="5" height="6"/><rect x="44" y="66" width="5" height="6"/><rect x="54" y="66" width="5" height="6"/>
                    <rect x="106" y="40" width="5" height="6"/><rect x="118" y="40" width="5" height="6"/><rect x="106" y="56" width="5" height="6"/><rect x="118" y="56" width="5" height="6"/><rect x="106" y="72" width="5" height="6"/><rect x="118" y="72" width="5" height="6"/></g>
                  </svg>
                  <span class="init">{{a.name.charAt(0)}}</span>
                </div>
              }
              <span class="shade"></span>
            </div>
            <div class="top">
              @if (a.distanceKm !== null) { <span class="pill"><ec-icon name="navigate" [size]="12"/> {{km(a.distanceKm)}}</span> } @else { <span></span> }
              @if (i === 0 && mode() === 'near' && a.distanceKm !== null) { <span class="pill hot">Closest</span> }
            </div>
            <div class="info">
              <h4><span class="u">{{a.name}}</span></h4>
              <p>@if (a.count) { {{a.count}} {{a.count === 1 ? 'home' : 'homes'}} · from {{money(a.minPrice)}} } @else { No homes yet }</p>
            </div>
            <span class="go" aria-hidden="true"><ec-icon name="arrowUR" [size]="18"/></span>
          </a>
        }
      </div>
      @if (hidden() > 0) {
        <div class="seeall"><a class="btn ghost" routerLink="/nearby">See {{hidden()}} more {{hidden() === 1 ? 'area' : 'areas'}} <ec-icon name="arrowR" [size]="17"/></a></div>
      }
    }
  </section>

  <ng-template #rbody let-r="r">
    <span class="tag"><ec-icon [name]="r.kind === 'near' ? 'locate' : r.kind === 'city' ? 'globe' : 'pin'" [size]="13"/> {{r.kind === 'near' ? 'Near me' : r.kind === 'city' ? 'City' : 'Locality'}}</span>
    <b>{{r.label}}</b>
    <small>{{ago(r)}}</small>
    <ec-icon class="ch" name="arrowR" [size]="16"/>
  </ng-template>
  `,
  styles: [`
  :host{display:block;min-width:0;max-width:100%}
  .nb{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;min-width:0}
  .recent{min-width:0;max-width:100%}
  .head{display:flex;justify-content:space-between;align-items:flex-end;gap:22px;flex-wrap:wrap;min-width:0}
  .head>div{min-width:0}
  .head h2{font-size:clamp(28px,3.4vw,42px);margin-top:10px}
  .sub{color:var(--ink-3);margin-top:10px;max-width:560px}
  .acts{display:flex;gap:10px;flex-wrap:wrap;max-width:100%}

  .rh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}.rh h3{font-family:var(--font-ui);font-weight:700;font-size:19px;letter-spacing:0}
  .clear{font-size:13px;font-weight:600;color:var(--ink-3);padding:4px 8px;border-radius:8px}.clear:hover{color:var(--ember);background:var(--sand)}
  .rrow{display:flex;gap:12px;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;padding:4px 2px 12px;scroll-snap-type:x proximity;scrollbar-width:none}.rrow::-webkit-scrollbar{display:none}
  .rc{position:relative;flex:0 0 clamp(190px,24vw,250px);scroll-snap-align:start;display:grid;gap:6px;align-content:start;min-height:112px;padding:14px 38px 14px 14px;background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow-sm);transition:transform .35s var(--ease),box-shadow .35s var(--ease),border-color .25s}
  .rc:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:var(--line-2)}
  .rc b{font-size:16px;line-height:1.25}
  .rc small{color:var(--ink-3);font-size:13px;align-self:end}
  .rc .ch{position:absolute;right:12px;top:14px;color:var(--ember);transition:transform .3s var(--ease)}.rc:hover .ch{transform:translateX(3px)}
  .tag{display:inline-flex;align-items:center;gap:5px;width:fit-content;font-size:12px;font-weight:700;color:#fff;background:var(--ok);padding:4px 10px 4px 8px;border-radius:7px}

  .note{display:flex;align-items:center;gap:9px;padding:12px 16px;border-radius:14px;background:var(--sand);color:var(--ink-2);font-size:14.5px;line-height:1.4;animation:fadein .5s both}
  .note.warn{background:#fdecea;color:#8f2b20}.note.ok{background:#e9f6ef;color:#17603f}
  .note .t{min-width:0}.note ec-icon{flex:none}.note .x{margin-left:auto;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;flex:none}.note .x:hover{background:rgba(0,0,0,.08)}

  .bar{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
  .ttl{font-family:var(--font-ui);font-weight:700;font-size:21px;letter-spacing:-.005em}
  .chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;max-width:100%;padding:2px}.chips::-webkit-scrollbar{display:none}
  .chips button{white-space:nowrap;padding:9px 16px;border-radius:12px;background:#fff;border:1.5px solid var(--line);font-weight:600;font-size:14.5px;color:var(--ink-2);transition:all .25s var(--ease)}
  .chips button:hover{border-color:var(--ink-3);transform:translateY(-1px)}
  .chips button.on{background:#fff;border-color:#2563c9;color:#2563c9;box-shadow:0 0 0 3px rgba(37,99,201,.12)}

  .tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(210px,100%),1fr));gap:18px;transition:opacity .3s}.tiles.busy{opacity:.55}
  .tile{position:relative;display:block;aspect-ratio:4/5;border-radius:24px;overflow:hidden;background:var(--sand-2);isolation:isolate;
    box-shadow:var(--shadow-sm);border:1px solid var(--line);animation:tilein .65s var(--ease) both;animation-delay:calc(var(--i, 0) * 45ms);
    transition:transform .5s var(--ease),box-shadow .5s var(--ease)}
  @keyframes tilein{from{opacity:0;transform:translateY(18px) scale(.97)}}
  .tile:hover,.tile:focus-visible{transform:translateY(-8px);box-shadow:var(--shadow-lg)}
  .tile:active{transform:scale(.98)}
  .tile.sk{animation:none;border-radius:24px}
  .tile.empty{filter:saturate(.7)}
  .pic{position:absolute;inset:0}.pic ec-img{height:100%}.pic ec-img{transition:transform 1s var(--ease)}.tile:hover .pic ec-img{transform:scale(1.08)}
  .shade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(16,26,43,.82) 0%,rgba(16,26,43,.28) 42%,rgba(16,26,43,0) 68%),linear-gradient(180deg,rgba(16,26,43,.28),transparent 28%)}
  .art{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b));color:var(--f);transition:transform 1s var(--ease)}
  .tile:hover .art{transform:scale(1.08)}
  .art svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:62%;opacity:.5}
  .art .init{font-family:var(--font-display);font-size:clamp(90px,11vw,130px);font-weight:600;line-height:1;color:rgba(255,255,255,.42);transform:translateY(-14%)}
  .p0{--a:#fbe3cf;--b:#ee9b7c;--f:#b3401f}.p1{--a:#dcebf5;--b:#8fb4d3;--f:#1d4f86}.p2{--a:#f7ebc6;--b:#e0b95c;--f:#8a5a10}
  .p3{--a:#def0e4;--b:#86c0a1;--f:#1c6b45}.p4{--a:#ebe1f6;--b:#b49bda;--f:#5d33a0}.p5{--a:#fde4ea;--b:#ec9fb2;--f:#a02c4c}
  .top{position:absolute;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;z-index:2}
  .pill{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:99px;background:rgba(255,255,255,.92);color:var(--ink);font-size:12.5px;font-weight:700;box-shadow:0 4px 12px -4px rgba(16,26,43,.35)}
  .pill ec-icon{color:var(--ember)}.pill.hot{background:var(--ember);color:#fff}
  .info{position:absolute;left:16px;right:58px;bottom:16px;color:#fff;z-index:2}
  .info h4{overflow-wrap:anywhere;font-family:var(--font-display);font-size:clamp(19px,1.55vw,23px);font-weight:600;line-height:1.1;letter-spacing:-.01em}
  .u{background:linear-gradient(currentColor,currentColor) 0 100%/0 2px no-repeat;padding-bottom:3px;transition:background-size .45s var(--ease)}
  .tile:hover .u,.tile:focus-visible .u{background-size:100% 2px}
  .info p{margin-top:6px;font-size:13.5px;color:rgba(255,255,255,.88)}
  .go{position:absolute;right:12px;bottom:14px;width:36px;height:36px;border-radius:50%;background:#fff;color:var(--ink);display:grid;place-items:center;z-index:2;opacity:.9;transform:translate(0,0) rotate(0);transition:all .4s var(--ease)}
  .tile:hover .go{background:var(--ember);color:#fff;transform:rotate(45deg) scale(1.05)}
  .seeall{display:flex;justify-content:center;margin-top:8px}
  .state{text-align:center;padding:56px 16px;display:grid;justify-items:center;gap:10px;background:var(--sand);border-radius:var(--r-lg)}.state ec-icon{color:var(--ember)}.state h3{font-size:24px}.state p{color:var(--ink-3);max-width:440px}

  @media(max-width:700px){
    .tiles{grid-template-columns:repeat(2,1fr);gap:12px}
    .tile{border-radius:20px;aspect-ratio:3/4}
    .info{left:12px;right:46px;bottom:12px}.go{right:10px;bottom:10px;width:32px;height:32px}
    .info p{font-size:12.5px}
    .acts{width:100%}.acts .btn{flex:1}
  }
  @media(prefers-reduced-motion:reduce){.tile,.rc,.note{animation:none!important}.tile:hover{transform:none}}
  `]
})
export class NearbyAreas {
  svc = inject(NearbyService);
  /** compact = home-page version (own heading, first 8 areas) */
  compact = input(false);
  showRecent = input(true);
  max = input(0);

  sort = signal<Mode>('');
  icons = CATEGORY_ICON;
  money = rupees;
  km = kmLabel;

  mode = computed<Mode>(() => {
    const s = this.sort();
    if (s === 'near' && !this.svc.hasCentre()) return 'most';
    return s || (this.svc.hasCentre() && !this.svc.data()?.outsideServiceArea ? 'near' : 'most');
  });
  chips = computed(() => {
    const out: { id: Mode; label: string }[] = [];
    if (this.svc.hasCentre() && !this.svc.data()?.outsideServiceArea) out.push({ id: 'near', label: 'Closest' });
    out.push({ id: 'most', label: 'Most homes' }, { id: 'budget', label: 'Budget friendly' }, { id: 'all', label: 'A – Z' });
    return out;
  });
  sorted = computed<NearbyArea[]>(() => {
    const a = [...this.svc.areas()];
    switch (this.mode()) {
      case 'near': return a.sort((x, y) => (x.distanceKm ?? 1e9) - (y.distanceKm ?? 1e9) || y.count - x.count);
      case 'budget': return a.sort((x, y) => (x.count ? 0 : 1) - (y.count ? 0 : 1) || (x.minPrice || 1e12) - (y.minPrice || 1e12));
      case 'all': return a.sort((x, y) => x.name.localeCompare(y.name));
      default: return a.sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
    }
  });
  private cap = computed(() => this.max() || (this.compact() ? 8 : 0));
  shown = computed(() => this.cap() ? this.sorted().slice(0, this.cap()) : this.sorted());
  hidden = computed(() => this.compact() ? Math.max(0, this.sorted().length - this.shown().length) : 0);

  constructor() { this.svc.ensure(); }

  hue(name: string): number { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 6; }

  remember(a: NearbyArea) { this.svc.remember({ kind: 'area', label: `${a.name}, ${a.city}`, city: a.city, area: a.name }); }

  ago(r: RecentSearch): string {
    const m = Math.round((Date.now() - r.ts) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return d === 1 ? 'Yesterday' : `${d} days ago`;
  }
}
