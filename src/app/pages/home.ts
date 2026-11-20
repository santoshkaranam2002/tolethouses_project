import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { MetaService } from '../core/services/meta.service';
import { Category, Property } from '../core/models';
import { Icon, CATEGORY_ICON } from '../core/ui/icon';
import { Img } from '../core/ui/img';
import { RevealDirective } from '../core/directives/motion';
import { rupees, unitOf } from '../core/format';
import { Card } from '../shared/property-card';
import { CardSkeleton } from '../shared/card-skeleton';
import { SearchBar } from '../shared/search-bar';
import { NearbyAreas } from '../shared/nearby-areas';

@Component({
  selector: 'ec-home', standalone: true,
  imports: [RouterLink, Icon, Img, Card, CardSkeleton, SearchBar, NearbyAreas, RevealDirective],
  template: `
  <!-- HERO: one big photo, one headline, one search -->
  <section class="wrap hero">
    <div class="stage">
      @for (h of heroList(); track h.id) {
        <ec-img class="slide" [class.on]="$index === slide()" [src]="h.images[0]" [seed]="h.id" [label]="h.categoryLabel" [alt]="h.title" [eager]="$index === 0"/>
      } @empty { <div class="slide on plain"></div> }
      <div class="veil"></div>
      <div class="hc">
        <span class="tag"><ec-icon name="pin" [size]="15"/> Visakhapatnam</span>
        <h1>Find a home you’ll love<br>coming back to.</h1>
        <p>Houses, flats and serviced apartments for rent — real photos, honest rent, and a real person to talk to.</p>
      </div>
      @if (cur(); as h) {
        <a class="now" [routerLink]="['/homes', h.id]"><span><small>{{h.categoryLabel}}</small><b>{{money(h.price)}}<i>{{unit(h)}}</i></b></span><span class="go"><ec-icon name="arrowUR" [size]="18"/></span></a>
      }
      @if (heroList().length > 1) {
        <div class="dots">@for (h of heroList(); track h.id) { <button (click)="go($index)" [class.on]="$index === slide()" [attr.aria-label]="'Show home ' + ($index + 1)"></button> }</div>
      }
    </div>
    <div class="sbar"><ec-search-bar /></div>
  </section>

  <!-- NEARBY AREAS / SEARCH NEAR ME -->
  <section class="sec"><div class="wrap"><ec-nearby [compact]="true"/></div></section>

  <!-- CATEGORIES -->
  <section class="sec">
    <div class="wrap">
      <div class="head" appReveal><h2>Browse by type</h2><a routerLink="/homes" class="more">View all homes <ec-icon name="arrowR" [size]="17"/></a></div>
      <div class="cats">
        @for (c of cats(); track c.key; let i = $index) {
          <a class="cat" [routerLink]="['/homes']" [queryParams]="{category: c.key}" appReveal [revealDelay]="i * 60">
            <div class="cimg">
              @if (catImg()[c.key]; as img) {
                <ec-img [src]="img" [seed]="c.key" [label]="c.short" [alt]="c.label"/>
                <span class="ibadge"><ec-icon [name]="icons[c.key]" [size]="20"/></span>
              } @else {
                <div class="iart t{{i % 5}}"><span class="ic"><ec-icon [name]="icons[c.key]" [size]="44" [stroke]="1.6"/></span></div>
              }
            </div>
            <div class="cinfo"><h3>{{c.label}}</h3><span>{{c.count}} {{c.count === 1 ? 'home' : 'homes'}}</span></div>
          </a>
        }
      </div>
    </div>
  </section>

  <!-- FEATURED -->
  <section class="sec">
    <div class="wrap">
      <div class="head" appReveal><h2>Featured homes</h2><a routerLink="/homes" class="more">See all <ec-icon name="arrowR" [size]="17"/></a></div>
      @if (loading()) { <div class="grid">@for (i of [1,2,3]; track i) { <ec-card-skeleton /> }</div> }
      @else if (error()) { <div class="state"><ec-icon name="alert" [size]="30"/><h3>We couldn’t load homes right now</h3><p>{{error()}}</p><button class="btn" (click)="load()">Try again</button></div> }
      @else if (!featured().length) { <div class="state"><ec-icon name="home" [size]="30"/><h3>New homes are being added</h3><p>Check back shortly.</p></div> }
      @else { <div class="grid">@for (p of featured(); track p.id; let i = $index) { <div appReveal [revealDelay]="(i % 3) * 70"><ec-card [p]="p"/></div> }</div> }
    </div>
  </section>

  <!-- WHY -->
  <section class="sec">
    <div class="wrap">
      <div class="why">
        @for (f of why; track f.t; let i = $index) {
          <div class="w" appReveal [revealDelay]="i * 90"><span class="wi"><ec-icon [name]="f.i" [size]="24"/></span><h3>{{f.t}}</h3><p>{{f.d}}</p></div>
        }
      </div>
    </div>
  </section>

  <!-- LOCALITIES -->
  @if (localities().length) {
    <section class="sec">
      <div class="wrap">
        <div class="head" appReveal><h2>Popular in {{cityName()}}</h2></div>
        <div class="locs">
          @for (l of localities(); track l.area) {
            <a class="loc" [routerLink]="['/homes']" [queryParams]="{city: l.city, area: l.area}" appReveal><ec-icon name="pin" [size]="16"/> {{l.area}}</a>
          }
        </div>
      </div>
    </section>
  }

  <!-- CTA -->
  <section class="wrap cta-wrap">
    <div class="cta" appReveal>
      <div><h2>Ready to find your place?</h2><p>Save the homes you like, then send an enquiry — the owner’s team replies directly.</p></div>
      <div class="cb"><a routerLink="/homes" class="btn gold">Browse homes</a><a routerLink="/signup" class="btn light">Create account</a></div>
    </div>
  </section>
  `,
  styles: [`
  :host{display:block}
  .hero{padding-top:20px;position:relative}
  .stage{position:relative;height:clamp(440px,62vh,600px);border-radius:32px;overflow:hidden;background:var(--ink)}
  .slide{position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease}.slide.on{opacity:1}
  .slide ec-img,ec-img.slide{height:100%}
  .plain{background:radial-gradient(circle at 80% 20%,rgba(233,162,59,.4),transparent 45%),linear-gradient(135deg,#e2552d,#101a2b)}
  .veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(16,26,43,.78) 0%,rgba(16,26,43,.35) 55%,rgba(16,26,43,.1) 100%),linear-gradient(0deg,rgba(16,26,43,.45),transparent 40%)}
  .hc{position:absolute;left:clamp(24px,5vw,64px);top:50%;transform:translateY(-58%);color:#fff;max-width:640px;display:grid;gap:18px}
  .tag{display:inline-flex;align-items:center;gap:6px;width:fit-content;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);padding:8px 14px;border-radius:99px;font-weight:600;font-size:14px;animation:rise .8s var(--ease) both}
  .hc h1{font-size:clamp(36px,5.4vw,68px);line-height:1.04;animation:rise .9s .1s var(--ease) both}
  .hc p{font-size:clamp(15px,1.5vw,18px);color:rgba(255,255,255,.86);max-width:480px;line-height:1.6;animation:rise .9s .2s var(--ease) both}
  @keyframes rise{from{opacity:0;transform:translateY(20px)}}
  .now{position:absolute;right:24px;top:24px;display:flex;align-items:center;gap:16px;background:#fff;color:var(--ink);padding:12px 12px 12px 20px;border-radius:99px;box-shadow:var(--shadow);transition:transform .35s var(--ease)}.now:hover{transform:translateY(-3px)}
  .now small{display:block;font-size:11.5px;color:var(--ink-3);font-weight:600}.now b{font-family:var(--font-display);font-size:20px;font-weight:600}.now i{font-style:normal;font-family:var(--font-ui);font-size:13px;color:var(--ink-3);font-weight:500;margin-left:4px}
  .go{width:40px;height:40px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;flex:none}
  .dots{position:absolute;left:clamp(24px,5vw,64px);bottom:76px;display:flex;gap:8px}.dots button{width:8px;height:8px;border-radius:99px;background:rgba(255,255,255,.5);transition:all .35s var(--ease)}.dots button.on{width:28px;background:#fff}
  .sbar{position:relative;z-index:3;margin:-52px clamp(12px,3vw,40px) 0}

  .sec{padding-top:88px}
  .head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:28px}.head h2{font-size:clamp(30px,3.6vw,44px)}
  .more{display:inline-flex;align-items:center;gap:6px;color:var(--ember);font-weight:700;white-space:nowrap;transition:gap .25s}.more:hover{gap:10px}

  .cats{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
  .cat{display:block;border-radius:var(--r-lg);overflow:hidden;background:#fff;border:1px solid var(--line);transition:all .4s var(--ease)}.cat:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg)}
  .cimg{aspect-ratio:1/1;overflow:hidden;position:relative}.cimg ec-img{height:100%}.cimg ec-img{transition:transform .9s var(--ease)}.cat:hover .cimg ec-img{transform:scale(1.07)}
  .ibadge{position:absolute;left:12px;bottom:12px;width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.95);color:var(--ember);display:grid;place-items:center}
  .iart{height:100%;display:grid;place-items:center;background:linear-gradient(135deg,var(--a),var(--b))}
  .iart .ic{width:96px;height:96px;border-radius:30px;background:rgba(255,255,255,.72);color:var(--f);display:grid;place-items:center;box-shadow:0 14px 30px -14px rgba(16,26,43,.45);transition:transform .5s var(--ease)}.cat:hover .iart .ic{transform:scale(1.1) rotate(-5deg)}
  .t0{--a:#fbe3cf;--b:#f0a58a;--f:#b3401f}.t1{--a:#dcebf5;--b:#93b7d4;--f:#1d4f86}.t2{--a:#f7ebc6;--b:#e2bf6a;--f:#8a5a10}.t3{--a:#def0e4;--b:#8cc4a6;--f:#1c6b45}.t4{--a:#ebe1f6;--b:#b9a0dd;--f:#5d33a0}
  .cinfo{padding:14px 16px 16px}.cinfo h3{font-family:var(--font-ui);font-size:15.5px;font-weight:600;letter-spacing:0;line-height:1.3}.cinfo span{color:var(--ink-3);font-size:14px}

  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
  .state{text-align:center;padding:60px 16px;display:grid;justify-items:center;gap:10px;background:var(--sand);border-radius:var(--r-lg)}.state ec-icon{color:var(--ember)}.state h3{font-size:24px}.state p{color:var(--ink-3)}

  .why{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .w{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:28px;transition:all .4s var(--ease)}.w:hover{transform:translateY(-5px);box-shadow:var(--shadow)}
  .wi{width:52px;height:52px;border-radius:16px;background:var(--gold-soft);color:var(--ember-2);display:grid;place-items:center;margin-bottom:18px}
  .w h3{font-size:22px;margin-bottom:8px}.w p{color:var(--ink-3);line-height:1.6}

  .locs{display:flex;flex-wrap:wrap;gap:10px}
  .loc{display:inline-flex;align-items:center;gap:7px;padding:11px 18px;border-radius:99px;background:#fff;border:1px solid var(--line);font-weight:600;font-size:14.5px;transition:all .3s var(--ease)}.loc ec-icon{color:var(--ember)}
  .loc:hover{background:var(--ink);color:#fff;border-color:var(--ink);transform:translateY(-3px)}.loc:hover ec-icon{color:var(--gold)}

  .cta-wrap{padding-top:88px}
  .cta{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;border-radius:32px;padding:clamp(28px,4vw,52px);color:#fff;background:radial-gradient(500px 260px at 95% 10%,rgba(233,162,59,.35),transparent 60%),var(--ink)}
  .cta h2{font-size:clamp(28px,3.4vw,42px);color:#fff}.cta p{color:rgba(255,255,255,.75);margin-top:8px;max-width:520px}.cb{display:flex;gap:10px;flex-wrap:wrap}

  @media(max-width:1000px){.cats{grid-template-columns:repeat(3,1fr)}.grid,.why{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:700px){
    .hero{padding-top:12px}.stage{border-radius:24px;height:440px}.hc{top:44%;right:20px;left:20px}.hc h1{font-size:34px}.hc h1 br{display:none}.now{left:16px;right:16px;top:auto;bottom:56px;justify-content:space-between}.dots{display:none}
    .sbar{margin:-36px 0 0}.sec{padding-top:56px}.cats{grid-template-columns:repeat(2,1fr);gap:12px}.cat:last-child{grid-column:1/-1}.cat:last-child .cimg{aspect-ratio:2/1}
    .grid,.why{grid-template-columns:1fr}.cta{border-radius:22px}.cb{width:100%}.cb .btn{flex:1}.head{align-items:flex-end}
  }
  `]
})
export class Home implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private metaSvc = inject(MetaService);
  icons = CATEGORY_ICON;
  money = rupees; unit = unitOf;
  why = [
    { i: 'image', t: 'Real homes, real photos', d: 'Every listing is added by our team with photos taken at the property — what you see is what you get.' },
    { i: 'shield', t: 'Honest rent', d: 'Monthly rent is shown up front. No hidden brokerage lines or surprise fees.' },
    { i: 'chat', t: 'A person answers', d: 'Send an enquiry and the owner’s team replies directly. Track every reply from your account.' },
  ];

  all = signal<Property[]>([]);
  loading = signal(true);
  error = signal('');
  slide = signal(0);
  private timer: any;

  cats = computed<Category[]>(() => this.metaSvc.categories());
  cityName = computed(() => this.metaSvc.cities()[0]?.name ?? '');
  heroList = computed(() => this.all().filter(p => p.images.length).slice(0, 5));
  cur = computed(() => this.heroList()[this.slide()] ?? this.all()[0]);
  featured = computed(() => this.all().slice(0, 6));
  catImg = computed(() => {
    const m: Record<string, string> = {};
    for (const p of this.all()) if (p.images.length && !m[p.category]) m[p.category] = p.images[0];
    return m;
  });
  localities = computed(() => this.metaSvc.cities().flatMap(c => c.areas.map(a => ({ city: c.name, area: a }))).slice(0, 18));

  ngOnInit() { this.metaSvc.load(); this.load(); }
  ngOnDestroy() { clearInterval(this.timer); }

  load() {
    this.loading.set(true); this.error.set('');
    this.api.properties({}, 40).subscribe({
      next: r => {
        this.all.set(r.items); this.loading.set(false);
        clearInterval(this.timer);
        if (this.heroList().length > 1) this.timer = setInterval(() => this.slide.update(i => (i + 1) % this.heroList().length), 5200);
      },
      error: e => { this.error.set(e.message); this.loading.set(false); }
    });
  }
  go(i: number) { this.slide.set(i); }
}
