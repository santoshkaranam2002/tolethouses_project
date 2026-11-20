import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../core/services/meta.service';
import { NearbyService } from '../core/services/nearby.service';
import { Icon } from '../core/ui/icon';
import { RevealDirective } from '../core/directives/motion';
import { kmLabel } from '../core/format';
import { Card } from '../shared/property-card';
import { CardSkeleton } from '../shared/card-skeleton';
import { NearbyAreas } from '../shared/nearby-areas';

/** /nearby — pick a locality or tap "Near me", see the areas around it and the homes in them. */
@Component({
  selector: 'ec-nearby-page', standalone: true,
  imports: [RouterLink, FormsModule, Icon, RevealDirective, Card, CardSkeleton, NearbyAreas],
  template: `
  <section class="banner">
    <div class="wrap bn">
      <span class="eyebrow light">Search near me</span>
      <h1>Homes near <em>you</em></h1>
      <p>Pick where you’ll be, or share your location — we’ll line up the closest areas and their homes.</p>
    </div>
  </section>

  <div class="wrap">
    <div class="sc" role="search">
      <span class="k">Where do you want to live?</span>
      <div class="lrow">
        <label class="place">
          <ec-icon name="pin" [size]="22"/>
          <span class="val" [class.ph]="!svc.label() && !picked()">{{svc.label() || picked() || 'Choose your locality'}}</span>
          <select aria-label="Choose a locality" [ngModel]="current()" (ngModelChange)="choose($event)">
            <option value="">Choose your locality</option>
            @for (o of options(); track o.key) { <option [value]="o.key">{{o.name}}, {{o.city}}</option> }
          </select>
        </label>
        <button type="button" class="nm" (click)="svc.locate()" [disabled]="svc.geo() === 'asking'" [class.on]="svc.geo() === 'ok'">
          @if (svc.geo() === 'asking') { <span class="spin"></span> } @else { <ec-icon name="locate" [size]="19"/> }
          <span>{{svc.geo() === 'asking' ? 'Locating…' : 'Near Me'}}</span>
        </button>
      </div>
      <div class="meta">
        <label class="m"><span>Within</span>
          <select [ngModel]="svc.radius() ?? ''" (ngModelChange)="svc.setRadius($event === '' ? null : +$event)" aria-label="Search radius">
            <option value="">Any distance</option>
            @for (r of radii; track r) { <option [value]="r">{{r}} km</option> }
          </select></label>
        <div class="m r"><span>Areas nearby</span><b>{{svc.data()?.totalAreas ?? '–'}}</b></div>
      </div>
      <button type="button" class="btn ember go" (click)="search()"><ec-icon name="search" [size]="19"/> Search homes</button>
    </div>

    <div class="body">
      <ec-nearby [showRecent]="true"/>

      <section class="homes">
        <div class="hh" appReveal>
          <h2>{{svc.hasCentre() && !svc.data()?.outsideServiceArea ? 'Homes near ' + (svc.data()?.nearestArea || svc.label()) : 'Latest homes'}}</h2>
          <a routerLink="/homes" class="more">View all homes <ec-icon name="arrowR" [size]="17"/></a>
        </div>
        @if (svc.loading() && !props().length) { <div class="grid">@for (i of [1,2,3]; track i) { <ec-card-skeleton /> }</div> }
        @else if (!props().length) {
          <div class="state"><ec-icon name="home" [size]="30"/><h3>No homes in this range yet</h3><p>Try a wider distance or another locality.</p>
            <button class="btn" (click)="svc.setRadius(null)">Show any distance</button></div>
        } @else {
          <div class="grid">
            @for (p of props(); track p.id; let i = $index) {
              <div class="pc" appReveal [revealDelay]="(i % 3) * 70">
                @if (p.distanceKm !== null) { <span class="dist"><ec-icon name="navigate" [size]="13"/> {{km(p.distanceKm)}} away</span> }
                <ec-card [p]="p"/>
              </div>
            }
          </div>
        }
      </section>
    </div>
  </div>
  `,
  styles: [`
  :host{display:block;animation:pagein .7s var(--ease) both}
  .banner{position:relative;overflow:hidden;background:radial-gradient(circle at 85% 0%,rgba(233,162,59,.38),transparent 46%),radial-gradient(circle at 10% 100%,rgba(226,85,45,.45),transparent 50%),linear-gradient(140deg,#16233a,#101a2b);color:#fff;padding:54px 0 112px;border-radius:0 0 34px 34px}
  .banner::after{content:'';position:absolute;right:-30px;bottom:-30px;width:260px;height:150px;opacity:.45;background:repeating-linear-gradient(135deg,var(--gold) 0 3px,transparent 3px 14px);transform:skewX(-12deg)}
  .bn{position:relative;z-index:1;display:grid;gap:14px;animation:rise .8s var(--ease) both}
  @keyframes rise{from{opacity:0;transform:translateY(18px)}}
  .eyebrow.light{color:var(--gold)}
  .bn h1{font-size:clamp(36px,5.4vw,64px)}.bn h1 em{font-style:italic;color:var(--gold)}
  .bn p{max-width:520px;color:rgba(255,255,255,.82);font-size:clamp(15px,1.6vw,18px)}

  .sc{position:relative;z-index:3;margin:-64px auto 0;max-width:880px;background:#fff;border-radius:26px;border:1px solid var(--line);box-shadow:var(--shadow-lg);padding:22px 24px 46px;display:grid;gap:16px;animation:rise .8s .12s var(--ease) both}
  .k{font-size:15px;font-weight:600;color:var(--ink-2)}
  .lrow{display:flex;gap:14px;align-items:center}
  .place{position:relative;flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:10px 14px;margin:-10px -14px;border-radius:16px;cursor:pointer;transition:background .25s}
  .place:hover{background:var(--sand)}.place:focus-within{background:var(--sand);box-shadow:inset 0 0 0 2px var(--ember)}
  .place ec-icon{color:var(--ember)}
  .val{font-family:var(--font-display);font-size:clamp(22px,3vw,30px);font-weight:600;line-height:1.15;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .val.ph{color:var(--mute);font-weight:500}
  .place select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px}
  .nm{flex:none;display:inline-flex;align-items:center;gap:8px;padding:0 20px;min-height:48px;border-radius:14px;border:1.5px solid var(--ink);font-weight:700;font-size:15px;background:#fff;transition:all .3s var(--ease)}
  .nm:hover{background:var(--ink);color:#fff;transform:translateY(-2px);box-shadow:0 10px 22px -10px rgba(16,26,43,.5)}
  .nm.on{border-color:var(--ok);color:var(--ok)}.nm.on:hover{background:var(--ok);color:#fff}
  .nm[disabled]{opacity:.7;pointer-events:none}
  .nm .spin{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .7s linear infinite}
  .meta{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line);padding-top:14px}
  .m{display:grid;gap:2px;padding:0 4px;position:relative}
  .m+.m{border-left:1px solid var(--line);padding-left:20px}
  .m span{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
  .m b{font-family:var(--font-display);font-size:24px;font-weight:600}
  .m.r{text-align:right;padding-right:4px}
  .m select{appearance:none;border:0;background:transparent;font-family:var(--font-display);font-size:24px;font-weight:600;outline:none;cursor:pointer;padding:0;width:100%}
  .m:focus-within{box-shadow:0 2px 0 0 var(--ember)}
  .go{position:absolute;left:50%;bottom:-27px;transform:translateX(-50%);min-height:54px;padding:0 40px;font-size:17px;box-shadow:0 14px 28px -10px rgba(226,85,45,.7)}
  .go:hover{transform:translateX(-50%) translateY(-2px)}.go:active{transform:translateX(-50%) scale(.98)}

  .body{display:grid;grid-template-columns:minmax(0,1fr);gap:54px;padding:56px 0 20px;min-width:0}
  .homes{min-width:0}
  .hh{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:22px}.hh h2{font-size:clamp(26px,3.2vw,38px)}
  .more{display:inline-flex;align-items:center;gap:6px;color:var(--ember);font-weight:700;white-space:nowrap;transition:gap .25s}.more:hover{gap:10px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
  .pc{position:relative}
  .dist{display:inline-flex;align-items:center;gap:6px;margin:0 0 8px 4px;padding:5px 12px;border-radius:99px;background:#e9f6ef;color:#17603f;font-size:13px;font-weight:700}
  .state{text-align:center;padding:56px 16px;display:grid;justify-items:center;gap:10px;background:var(--sand);border-radius:var(--r-lg)}.state ec-icon{color:var(--ember)}.state h3{font-size:24px}.state p{color:var(--ink-3)}

  @media(max-width:980px){.grid{grid-template-columns:repeat(2,1fr);gap:20px}}
  @media(max-width:640px){
    .banner{padding:36px 0 96px;border-radius:0 0 26px 26px}
    .sc{padding:18px 16px 44px;border-radius:22px;margin-top:-56px}
    .lrow{flex-direction:column;align-items:stretch;gap:12px}
    .place{margin:-8px -10px}
    .nm{justify-content:center;min-height:50px}
    .m b,.m select{font-size:20px}.m+.m{padding-left:14px}
    .grid{grid-template-columns:1fr}
    .body{gap:42px}
  }
  @media(prefers-reduced-motion:reduce){:host,.bn,.sc{animation:none}}
  `]
})
export class Nearby implements OnInit {
  svc = inject(NearbyService);
  private meta = inject(MetaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  km = kmLabel;
  radii = [2, 5, 10, 20, 40];

  options = computed(() => {
    const fromMeta = this.meta.cities().flatMap(c => c.areas.map(a => ({ key: `${c.name}|${a}`, name: a, city: c.name })));
    return fromMeta.length ? fromMeta : this.svc.areas().map(a => ({ key: `${a.city}|${a.name}`, name: a.name, city: a.city }));
  });
  picked = computed(() => { const a = this.svc.pickedArea(); return a ? `${a.name}, ${a.city}` : ''; });
  current = computed(() => { const a = this.svc.pickedArea(); return a ? `${a.city}|${a.name}` : ''; });
  props = computed(() => this.svc.data()?.properties ?? []);

  ngOnInit() {
    this.meta.load();
    const q = this.route.snapshot.queryParamMap;
    if (q.get('near') === '1' && this.svc.geo() === 'idle' && !this.svc.gps()) this.svc.locate();
    else if (q.get('area')) this.svc.pickArea(q.get('area')!, q.get('city') || '');
    else this.svc.ensure();
  }

  choose(key: string) {
    if (!key) { this.svc.clearCentre(); return; }
    const [city, ...rest] = key.split('|');
    this.svc.pickArea(rest.join('|'), city);
  }

  search() {
    const d = this.svc.data();
    const area = this.svc.pickedArea()?.name || (d && !d.outsideServiceArea ? d.nearestArea : '') || '';
    const city = this.svc.pickedArea()?.city || (area ? d?.areas.find(a => a.name === area)?.city : '') || this.meta.cities()[0]?.name || '';
    if (area) this.svc.remember({ kind: 'area', label: `${area}, ${city}`, city, area });
    this.router.navigate(['/homes'], { queryParams: { city: city || null, area: area || null } });
  }
}
