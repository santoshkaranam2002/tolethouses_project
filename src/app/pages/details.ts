import { Component, DestroyRef, HostListener, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { FavoritesService } from '../core/services/favorites.service';
import { ToastService } from '../core/services/toast.service';
import { Property } from '../core/models';
import { AMENITY_ICON, CATEGORY_ICON, Icon } from '../core/ui/icon';
import { Img } from '../core/ui/img';
import { RevealDirective } from '../core/directives/motion';
import { rupees, unitOf, waLink } from '../core/format';
import { Card } from '../shared/property-card';

@Component({
  selector: 'ec-details', standalone: true,
  imports: [RouterLink, FormsModule, Icon, Img, Card, RevealDirective],
  template: `
  @if (loading()) {
    <div class="wrap pad"><div class="skel sk-h"></div><div class="skel sk-g"></div></div>
  } @else if (error()) {
    <div class="wrap pad"><div class="state"><ec-icon name="home" [size]="38"/><h2>{{notFound() ? 'This home isn’t available' : 'Couldn’t load this home'}}</h2><p>{{error()}}</p>
      <div class="sb"><a routerLink="/homes" class="btn">Browse homes</a>@if (!notFound()) { <button class="btn ghost" (click)="fetch(id())">Try again</button> }</div></div></div>
  } @else if (p(); as h) {
    <div class="wrap pad">
      <div class="crumbs"><a routerLink="/homes"><ec-icon name="chevL" [size]="16"/> Back to homes</a>
        <span class="trail"><a routerLink="/">Home</a> / <a [routerLink]="['/homes']" [queryParams]="{category: h.category}">{{h.categoryLabel}}</a> / {{h.city}}</span></div>

      <div class="titlebar">
        <div>
          <div class="tags"><span class="chip ink"><ec-icon [name]="icons[h.category]" [size]="14"/> {{h.categoryLabel}}</span>
            @if (h.featured) { <span class="chip gold">★ Featured</span> }
            <span class="chip" [class.rent]="h.status==='Rented'">{{h.status === 'Available' ? '● Available now' : 'Currently rented'}}</span></div>
          <h1>{{h.title}}</h1>
          <p class="loc"><ec-icon name="pin" [size]="18"/> {{h.location ? h.location + ', ' : ''}}{{h.city}}</p>
        </div>
        <div class="acts">
          <button class="ab" (click)="share(h)"><ec-icon name="share" [size]="18"/> Share</button>
          <button class="ab" [class.on]="favs.has(h.id)" (click)="save(h)" [attr.aria-pressed]="favs.has(h.id)"><ec-icon name="heart" [size]="18" [fill]="favs.has(h.id)"/> {{favs.has(h.id) ? 'Saved' : 'Save'}}</button>
        </div>
      </div>

      <!-- ── gallery ── -->
      <div class="gal g{{min(imgs().length, 5)}}">
        @for (im of shown(); track $index) {
          <button class="tile t{{$index}}" (click)="openLb($index)" [attr.aria-label]="'Open photo ' + ($index + 1)">
            <ec-img [src]="im" [seed]="h.id" [label]="h.categoryLabel" [alt]="h.title + ' photo ' + ($index + 1)" [eager]="$index === 0"/>
            @if ($index === shown().length - 1 && imgs().length > shown().length) { <span class="more"><ec-icon name="camera" [size]="20"/> +{{imgs().length - shown().length}} photos</span> }
          </button>
        } @empty {
          <div class="tile t0"><ec-img [src]="''" [seed]="h.id" [label]="h.categoryLabel" [alt]="h.title"/></div>
        }
        @if (imgs().length > 1) { <button class="all" (click)="openLb(0)"><ec-icon name="grid" [size]="16"/> View all {{imgs().length}} photos</button> }
      </div>
      <!-- mobile swipe gallery -->
      <div class="swipe" (scroll)="onSwipe($event)">
        @for (im of imgs(); track $index) { <button class="sl" (click)="openLb($index)"><ec-img [src]="im" [seed]="h.id" [label]="h.categoryLabel" [alt]="h.title + ' photo ' + ($index + 1)" [eager]="$index === 0"/></button> }
        @empty { <div class="sl"><ec-img [src]="''" [seed]="h.id" [label]="h.categoryLabel" [alt]="h.title"/></div> }
        @if (imgs().length > 1) { <span class="ctr">{{swipeIdx() + 1}} / {{imgs().length}}</span> }
      </div>

      <div class="cols">
        <div class="main">
          <div class="facts" appReveal>
            @if (h.beds) { <div><ec-icon name="bed" [size]="24"/><b>{{h.beds}}</b><small>Bedroom{{h.beds>1?'s':''}}</small></div> }
            @if (h.baths) { <div><ec-icon name="bath" [size]="24"/><b>{{h.baths}}</b><small>Bathroom{{h.baths>1?'s':''}}</small></div> }
            @if (h.area) { <div><ec-icon name="area" [size]="24"/><b>{{h.area}}</b><small>sq ft</small></div> }
            @if (h.floor && h.floor !== '—') { <div><ec-icon name="building" [size]="24"/><b>{{h.floor}}</b><small>Floor</small></div> }
            <div><ec-icon name="sofa" [size]="24"/><b>{{h.furnishing}}</b><small>Furnishing</small></div>
          </div>

          <section appReveal>
            <h2>About this home</h2>
            <div class="desc" [class.clamp]="!more() && long()">
              @for (para of paras(); track $index) { <p>{{para}}</p> } @empty { <p class="muted">The owner hasn’t added a description yet — send an enquiry and we’ll share every detail.</p> }
            </div>
            @if (long()) { <button class="link" (click)="more.set(!more())">{{more() ? 'Show less' : 'Read more'}}</button> }
          </section>

          @if (h.amenities.length) {
            <section appReveal>
              <h2>What this place offers</h2>
              <div class="amen">@for (a of h.amenities; track a) { <div><span><ec-icon [name]="amenIcon[a] || 'check'" [size]="20"/></span>{{a}}</div> }</div>
            </section>
          }

          <section appReveal>
            <h2>Where you’ll be</h2>
            <p class="muted lc">{{h.location ? h.location + ', ' : ''}}{{h.city}}</p>
            @if (mapUrl(); as m) { <div class="map"><iframe [src]="m" loading="lazy" title="Map showing the home's location" referrerpolicy="no-referrer"></iframe></div> }
            <a class="btn ghost sm gm" [href]="gmaps(h)" target="_blank" rel="noopener"><ec-icon name="pin" [size]="16"/> Open in Google Maps</a>
          </section>
        </div>

        <!-- ── enquiry card ── -->
        <aside class="side">
          <div class="box">
            <div class="pr"><b>{{money(h.price)}}</b><span>{{unit(h)}}</span></div>
            <p class="pn">Rent per month · no hidden brokerage shown</p>
            @if (h.status === 'Rented') { <div class="warn"><ec-icon name="alert" [size]="18"/> This home is currently rented. You can still enquire to be told when it’s free.</div> }

            @if (sent()) {
              <div class="done"><span class="ok"><ec-icon name="check" [size]="30" [stroke]="2.4"/></span><h3>Enquiry sent!</h3>
                <p>The owner’s team will reach out on <b>{{phone}}</b> shortly.</p>
                <div class="db">@if (auth.loggedIn() && !auth.isAdmin()) { <a routerLink="/enquiries" class="btn sm">Track my enquiries</a> } @else if (!auth.loggedIn()) { <a routerLink="/signup" class="btn sm">Create account to track replies</a> }
                  <button class="btn ghost sm" (click)="sent.set(false)">Send another</button></div></div>
            } @else {
              <form (ngSubmit)="submit(h)" novalidate>
                <label class="field"><span>Your name</span><input class="input" [class.invalid]="tried() && nameBad()" name="name" [(ngModel)]="name" autocomplete="name" placeholder="Full name" maxlength="100"/>@if (tried() && nameBad()) { <small class="err">Please enter your name.</small> }</label>
                <label class="field"><span>Phone number</span><input class="input" [class.invalid]="tried() && phoneBad()" name="phone" [(ngModel)]="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91 98765 43210" maxlength="20"/>@if (tried() && phoneBad()) { <small class="err">Enter a valid phone number (7–15 digits).</small> }</label>
                <label class="field"><span>Message</span><textarea class="textarea" name="message" [(ngModel)]="message" rows="3" maxlength="500"></textarea></label>
                @if (formError()) { <p class="err fe">{{formError()}}</p> }
                <button class="btn ember block" type="submit" [disabled]="sending()">@if (sending()) { <span class="spin"></span> Sending… } @else { <ec-icon name="chat" [size]="19"/> Contact owner }</button>
              </form>
            }

            <div class="alt">
              @if (h.ownerPhone) { <a class="btn ghost sm" [href]="'tel:' + h.ownerPhone"><ec-icon name="phone" [size]="16"/> Call</a>
                <a class="btn ghost sm" [href]="wa(h)" target="_blank" rel="noopener"><ec-icon name="chat" [size]="16"/> WhatsApp</a> }
            </div>
            <div class="owner"><span class="av">{{(h.ownerName || 'E').charAt(0)}}</span><div><b>{{h.ownerName || 'EstateCraft Desk'}}</b><small>Listing owner · usually replies within a day</small></div></div>
          </div>
        </aside>
      </div>

      @if (similar().length) {
        <section class="sim" appReveal>
          <div class="sh"><h2>You might also like</h2><a routerLink="/homes" [queryParams]="{category: h.category}" class="btn ghost sm">See more</a></div>
          <div class="simg">@for (s of similar(); track s.id) { <ec-card [p]="s"/> }</div>
        </section>
      }
    </div>

    <!-- mobile sticky action bar -->
    <div class="mbar"><div><b>{{money(h.price)}}</b><small>{{unit(h)}}</small></div><a class="btn ember" href="#enquire" (click)="jump($event)">Contact owner</a></div>

    <!-- ── lightbox ── -->
    @if (lb() !== null) {
      <div class="lb" role="dialog" aria-modal="true" aria-label="Photo gallery" (touchstart)="tx = $event.touches[0].clientX" (touchend)="swipeEnd($event)">
        <div class="lbt"><span>{{lb()! + 1}} / {{imgs().length}}</span><button class="icon-btn x" (click)="closeLb()" aria-label="Close gallery"><ec-icon name="close" [size]="26"/></button></div>
        <button class="nav l" (click)="step(-1)" aria-label="Previous photo"><ec-icon name="chevL" [size]="28"/></button>
        <div class="stage" (click)="closeLb()">
          @for (im of imgs(); track $index) { @if (near($index)) { <img class="big" [class.on]="$index === lb()" [src]="im" [alt]="h.title + ' photo ' + ($index + 1)" (click)="$event.stopPropagation()"/> } }
        </div>
        <button class="nav r" (click)="step(1)" aria-label="Next photo"><ec-icon name="chevR" [size]="28"/></button>
        <div class="strip">@for (im of imgs(); track $index) { <button [class.on]="$index === lb()" (click)="lb.set($index)" [attr.aria-label]="'Go to photo ' + ($index + 1)"><img [src]="im" alt="" loading="lazy"/></button> }</div>
      </div>
    }
  }
  `,
  styles: [`
  :host{display:block}
  .pad{padding:26px 0 0}
  .sk-h{height:90px;width:60%;margin-bottom:24px}.sk-g{height:460px;border-radius:var(--r-lg)}
  .state{background:var(--sand);border-radius:var(--r-lg);padding:80px 20px;text-align:center;display:grid;justify-items:center;gap:12px;color:var(--ink-3)}.state h2{color:var(--ink);font-size:34px}.state ec-icon{color:var(--ember)}.sb{display:flex;gap:10px;margin-top:10px}
  .crumbs{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px;font-size:14px;color:var(--ink-3);flex-wrap:wrap}
  .crumbs>a:first-child{display:inline-flex;align-items:center;gap:4px;font-weight:600;color:var(--ink);padding:6px 12px 6px 6px;border-radius:99px;transition:background .2s}.crumbs>a:first-child:hover{background:var(--sand)}
  .trail a:hover{color:var(--ember)}
  .titlebar{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap}
  .tags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.chip.gold{background:var(--gold-soft);color:#8a5a10}.chip.rent{background:#fde2dc;color:var(--bad)}
  h1{font-size:clamp(30px,4.2vw,50px);max-width:820px}.loc{display:flex;align-items:center;gap:6px;color:var(--ink-3);margin-top:12px;font-size:17px}
  .acts{display:flex;gap:8px}.ab{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:99px;border:1.5px solid var(--line);font-weight:600;background:#fff;transition:all .3s var(--ease)}.ab:hover{border-color:var(--ink);transform:translateY(-2px)}.ab.on{background:var(--ember);border-color:var(--ember);color:#fff}

  .gal{display:grid;gap:10px;grid-template-columns:2fr 1fr 1fr;grid-template-rows:260px 260px;border-radius:var(--r-lg);overflow:hidden;position:relative}
  .tile{position:relative;overflow:hidden;display:block;background:var(--sand-2);cursor:zoom-in;animation:pagein .8s var(--ease) both}
  .tile ec-img{height:100%;width:100%}.tile:hover ec-img{transform:scale(1.06)}.tile ec-img{transition:transform 1s var(--ease)}
  .tile::after{content:'';position:absolute;inset:0;background:rgba(16,26,43,0);transition:background .4s}.tile:hover::after{background:rgba(16,26,43,.12)}
  .t0{grid-row:1/3}.t1{animation-delay:.08s}.t2{animation-delay:.16s}.t3{animation-delay:.24s}.t4{animation-delay:.32s}
  .g1{grid-template-columns:1fr;grid-template-rows:480px}.g1 .t0{grid-row:auto}
  .g2{grid-template-columns:1fr 1fr;grid-template-rows:480px}.g2 .t0{grid-row:auto}
  .g3{grid-template-columns:2fr 1fr;grid-template-rows:240px 240px}
  .g4{grid-template-columns:2fr 1fr 1fr;grid-template-rows:240px 240px}.g4 .t3{grid-column:2/4}
  .more{position:absolute;inset:0;z-index:2;background:rgba(16,26,43,.55);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:17px}
  .all{position:absolute;right:16px;bottom:16px;z-index:3;background:#fff;padding:11px 18px;border-radius:99px;font-weight:600;display:inline-flex;gap:8px;align-items:center;box-shadow:var(--shadow);transition:transform .3s var(--ease)}.all:hover{transform:translateY(-3px)}
  .swipe{display:none}

  .cols{display:grid;grid-template-columns:1fr 400px;gap:60px;margin-top:40px;align-items:start}
  .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:0;border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;background:#fff}
  .facts div{display:grid;justify-items:start;gap:2px;padding:20px 22px;border-right:1px solid var(--line);transition:background .3s}.facts div:last-child{border-right:0}.facts div:hover{background:var(--sand)}
  .facts ec-icon{color:var(--ember);margin-bottom:6px}.facts b{font-family:var(--font-display);font-size:24px;font-weight:600}.facts small{color:var(--ink-3)}
  .main section{margin-top:52px}.main h2{font-size:30px;margin-bottom:18px}
  .desc{color:var(--ink-2);font-size:17px;line-height:1.75;display:grid;gap:14px}.desc.clamp{display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
  .link{margin-top:12px;font-weight:700;color:var(--ember);text-decoration:underline;text-underline-offset:4px}
  .amen{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
  .amen div{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;background:var(--sand);font-weight:500;transition:all .35s var(--ease)}
  .amen div:hover{background:var(--ink);color:#fff;transform:translateY(-3px)}.amen span{width:38px;height:38px;border-radius:12px;background:#fff;color:var(--ember);display:grid;place-items:center;flex:none;transition:transform .4s var(--ease)}.amen div:hover span{transform:rotate(-10deg) scale(1.08)}
  .lc{margin:-8px 0 16px}.map{border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--line);height:320px;margin-bottom:14px}.map iframe{width:100%;height:100%;border:0}.gm{display:inline-flex}

  .side{position:sticky;top:calc(var(--nav-h) + 20px)}
  .box{background:#fff;border:1px solid var(--line);border-radius:28px;padding:28px;box-shadow:var(--shadow);display:grid;gap:14px}
  .pr{display:flex;align-items:baseline;gap:8px}.pr b{font-family:var(--font-display);font-size:42px;font-weight:600;letter-spacing:-.02em;line-height:1}.pr span{color:var(--ink-3)}
  .pn{font-size:13px;color:var(--mute);margin-top:-8px}
  .warn{display:flex;gap:10px;background:#fff3e0;color:#8a4b00;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.4}.warn ec-icon{flex:none;margin-top:1px}
  form{display:grid;gap:14px}.fe{margin:0}
  .alt{display:grid;grid-template-columns:1fr 1fr;gap:10px}.alt:empty{display:none}
  .owner{display:flex;gap:12px;align-items:center;padding-top:16px;border-top:1px dashed var(--line)}.owner small{display:block;color:var(--ink-3);font-size:12.5px}
  .av{width:44px;height:44px;border-radius:50%;background:var(--gold);color:var(--ink);display:grid;place-items:center;font-family:var(--font-display);font-weight:700;font-size:19px;flex:none}
  .done{text-align:center;display:grid;gap:8px;justify-items:center;padding:10px 0;animation:pagein .6s var(--ease)}.done h3{font-size:28px}.done p{color:var(--ink-3)}
  .ok{width:64px;height:64px;border-radius:50%;background:var(--ok);color:#fff;display:grid;place-items:center;animation:pop .6s var(--ease)}@keyframes pop{from{transform:scale(0)}60%{transform:scale(1.15)}}
  .db{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px}

  .sim{margin-top:90px}.sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:26px}.sh h2{font-size:32px}.simg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px}
  .mbar{display:none}

  .lb{position:fixed;inset:0;z-index:500;background:rgba(10,16,28,.97);display:grid;grid-template-rows:auto 1fr auto;animation:fade .3s}
  @keyframes fade{from{opacity:0}}
  .lbt{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;color:#fff;font-weight:600;grid-row:1;grid-column:1}.x{color:#fff}.x:hover{background:rgba(255,255,255,.12)}
  .stage{grid-row:2;grid-column:1;display:grid;place-items:center;position:relative;padding:0 76px;min-height:0}
  .big{position:absolute;max-width:calc(100% - 152px);max-height:100%;object-fit:contain;opacity:0;transform:scale(.97);transition:opacity .45s ease,transform .6s var(--ease);border-radius:12px;pointer-events:none}.big.on{opacity:1;transform:none;pointer-events:auto}
  .nav{position:absolute;top:50%;z-index:3;margin-top:-30px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;transition:all .3s}.nav:hover{background:rgba(255,255,255,.24);transform:scale(1.08)}.nav.l{left:16px}.nav.r{right:16px}
  .strip{grid-row:3;display:flex;gap:8px;padding:14px 20px 20px;overflow-x:auto;justify-content:center;scrollbar-width:none}
  .strip button{flex:none;width:76px;height:56px;border-radius:10px;overflow:hidden;opacity:.5;transition:all .3s;border:2px solid transparent}.strip button.on{opacity:1;border-color:var(--gold)}.strip button:hover{opacity:1}.strip img{width:100%;height:100%;object-fit:cover}

  @media(max-width:1000px){.cols{grid-template-columns:1fr;gap:30px}.side{position:static}}
  @media(max-width:760px){
    .gal{display:none}
    .swipe{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:8px;margin:0 -16px;padding:0 16px;scrollbar-width:none;position:relative}.swipe::-webkit-scrollbar{display:none}
    .sl{flex:0 0 100%;scroll-snap-align:center;aspect-ratio:4/3.2;border-radius:var(--r-lg);overflow:hidden;display:block}.sl ec-img{height:100%}
    .ctr{position:sticky;right:10px;bottom:12px;margin-left:-70px;align-self:flex-end;background:rgba(16,26,43,.75);color:#fff;font-size:13px;font-weight:700;padding:6px 12px;border-radius:99px;flex:none;margin-bottom:12px}
    .titlebar{margin-bottom:18px}.acts{width:100%}.ab{flex:1;justify-content:center}
    .facts div{padding:16px}.cols{margin-top:28px}.main section{margin-top:38px}.box{padding:22px;border-radius:24px}
    .mbar{display:flex;position:fixed;z-index:130;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));background:#fff;border:1px solid var(--line);border-radius:22px;padding:10px 10px 10px 18px;align-items:center;justify-content:space-between;box-shadow:var(--shadow-lg)}
    .mbar b{font-family:var(--font-display);font-size:23px;font-weight:600}.mbar small{color:var(--ink-3);margin-left:4px}
    .stage{padding:0 8px}.big{max-width:calc(100% - 16px)}.nav{display:none}.strip{justify-content:flex-start}
    .sim{margin-top:60px}
  }
  `]
})
export class Details {
  id = input.required<string>();
  private api = inject(ApiService);
  private san = inject(DomSanitizer);
  private toast = inject(ToastService);
  auth = inject(AuthService);
  favs = inject(FavoritesService);
  icons = CATEGORY_ICON; amenIcon = AMENITY_ICON; money = rupees; unit = unitOf; min = Math.min;

  p = signal<Property | null>(null);
  loading = signal(true);
  error = signal('');
  notFound = signal(false);
  similar = signal<Property[]>([]);
  more = signal(false);
  lb = signal<number | null>(null);
  swipeIdx = signal(0);
  sent = signal(false);
  sending = signal(false);
  tried = signal(false);
  formError = signal('');
  tx = 0;

  name = ''; phone = ''; message = '';

  imgs = computed(() => this.p()?.images ?? []);
  shown = computed(() => { const n = this.imgs().length; return this.imgs().slice(0, n >= 5 ? 5 : n === 4 ? 4 : n); });
  paras = computed(() => (this.p()?.description || '').split(/\n{1,}/).map(s => s.trim()).filter(Boolean));
  long = computed(() => (this.p()?.description || '').length > 380);
  nameBad = () => this.name.trim().length < 2;
  phoneBad = () => { const d = this.phone.replace(/\D/g, ''); return d.length < 7 || d.length > 15; };
  mapUrl = computed(() => {
    const h = this.p(); if (!h || h.latitude == null || h.longitude == null) return null;
    const d = 0.006, { latitude: la, longitude: lo } = h;
    return this.san.bypassSecurityTrustResourceUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${lo - d},${la - d},${lo + d},${la + d}&layer=mapnik&marker=${la},${lo}`);
  });

  constructor() {
    effect(() => { const id = this.id(); untracked(() => this.fetch(id)); });
    effect(() => document.body.classList.toggle('no-scroll', this.lb() !== null));
    effect(() => document.body.classList.toggle('has-mbar', !!this.p()));
    inject(DestroyRef).onDestroy(() => document.body.classList.remove('no-scroll', 'has-mbar'));
  }

  fetch(raw: string = this.id()) {
    const id = Number(raw);
    this.loading.set(true); this.error.set(''); this.notFound.set(false); this.sent.set(false); this.tried.set(false);
    if (!Number.isInteger(id)) { this.loading.set(false); this.notFound.set(true); this.error.set('That link doesn’t look right.'); return; }
    this.api.property(id).subscribe({
      next: h => {
        if (!h) { this.notFound.set(true); this.error.set('We couldn’t find this home. It may have been removed.'); this.loading.set(false); return; }
        this.p.set(h); this.loading.set(false);
        document.title = `${h.title} — EstateCraft`;
        const u = this.auth.user();
        this.name = u?.name ?? this.name; this.phone = u?.phone ?? this.phone;
        this.message = `Hi, I’m interested in “${h.title}”. Please share more details and a good time to visit.`;
        this.api.properties({ category: h.category, city: h.city }, 5).subscribe({ next: r => this.similar.set(r.items.filter(x => x.id !== h.id).slice(0, 4)), error: () => this.similar.set([]) });
      },
      error: e => { this.notFound.set(e.status === 404); this.error.set(e.status === 404 ? 'We couldn’t find this home. It may have been removed.' : e.message); this.loading.set(false); }
    });
  }

  submit(h: Property) {
    this.tried.set(true); this.formError.set('');
    if (this.sending() || this.nameBad() || this.phoneBad()) return;
    this.sending.set(true);
    this.api.addEnquiry({ propertyId: h.id, name: this.name.trim(), phone: this.phone.trim(), message: this.message.trim() }).subscribe({
      next: () => { this.sending.set(false); this.sent.set(true); this.toast.success('Enquiry sent — the owner’s team will contact you.'); },
      error: e => { this.sending.set(false); this.formError.set(e.message); }
    });
  }
  jump(e: Event) { e.preventDefault(); document.querySelector('.box')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  save(h: Property) { const on = this.favs.toggle(h.id); this.toast.info(on ? 'Saved to your shortlist' : 'Removed from saved'); }
  async share(h: Property) {
    const url = location.href;
    try {
      if (navigator.share) { await navigator.share({ title: h.title, url }); return; }
      await navigator.clipboard.writeText(url); this.toast.success('Link copied to clipboard');
    } catch { /* user cancelled */ }
  }
  wa(h: Property) { return waLink(h.ownerPhone, `Hi, I’m interested in "${h.title}" (${location.href})`); }
  gmaps(h: Property) {
    const q = h.latitude != null && h.longitude != null ? `${h.latitude},${h.longitude}` : encodeURIComponent(`${h.location} ${h.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  // gallery / lightbox
  openLb(i: number) { this.lb.set(i); }
  closeLb() { this.lb.set(null); }
  step(d: number) { const n = this.imgs().length; if (n) this.lb.update(i => i === null ? i : (i + d + n) % n); }
  near(i: number) { const c = this.lb(); const n = this.imgs().length; if (c === null) return false; const diff = Math.abs(i - c); return diff <= 1 || diff >= n - 1; }
  swipeEnd(e: TouchEvent) { const dx = e.changedTouches[0].clientX - this.tx; if (Math.abs(dx) > 50) this.step(dx < 0 ? 1 : -1); }
  onSwipe(e: Event) { const el = e.target as HTMLElement; this.swipeIdx.set(Math.round(el.scrollLeft / (el.clientWidth || 1))); }
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (this.lb() === null) return;
    if (e.key === 'Escape') this.closeLb();
    else if (e.key === 'ArrowRight') this.step(1);
    else if (e.key === 'ArrowLeft') this.step(-1);
  }
}
