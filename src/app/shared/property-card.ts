import { Component, OnDestroy, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property } from '../core/models';
import { FavoritesService } from '../core/services/favorites.service';
import { ToastService } from '../core/services/toast.service';
import { Icon, CATEGORY_ICON } from '../core/ui/icon';
import { Img } from '../core/ui/img';
import { rupees, unitOf } from '../core/format';

@Component({
  selector: 'ec-card', standalone: true,
  imports: [RouterLink, Icon, Img],
  template: `
  <a class="card" [routerLink]="['/homes', p().id]" [class.rented]="p().status === 'Rented'"
     (mouseenter)="startCycle()" (mouseleave)="stopCycle()" (focus)="startCycle()" (blur)="stopCycle()">
    <div class="media">
      <div class="slides">
        @for (img of imgs(); track $index) {
          <ec-img class="s" [class.on]="$index === idx()" [src]="img" [seed]="p().id" [label]="p().categoryLabel" [alt]="p().title + ' — photo ' + ($index + 1)"/>
        } @empty {
          <ec-img class="s on" [src]="''" [seed]="p().id" [label]="p().categoryLabel" [alt]="p().title"/>
        }
      </div>
      <span class="shade"></span>
      <div class="top">
        <span class="cat"><ec-icon [name]="icons[p().category]" [size]="14"/> {{p().categoryLabel}}</span>
        <button class="heart" type="button" [class.on]="favs.has(p().id)" (click)="toggle($event)" [attr.aria-label]="favs.has(p().id) ? 'Remove from saved' : 'Save home'" [attr.aria-pressed]="favs.has(p().id)">
          <ec-icon name="heart" [size]="19" [fill]="favs.has(p().id)"/>
        </button>
      </div>
      @if (imgs().length > 1) { <div class="dots">@for (_ of imgs(); track $index) { <i [class.on]="$index === idx()"></i> }</div> }
      @if (p().featured && p().status === 'Available') { <span class="flag">★ Featured</span> }
      @if (p().status === 'Rented') { <span class="flag rent">Currently rented</span> }
    </div>
    <div class="body">
      <div class="price"><b>{{money(p().price)}}</b><span>{{unit(p())}}</span></div>
      <h3>{{p().title}}</h3>
      <p class="loc"><ec-icon name="pin" [size]="15"/> {{p().location ? p().location + ', ' : ''}}{{p().city}}</p>
      <div class="facts">
        @if (p().beds) { <span><ec-icon name="bed" [size]="16"/> {{p().beds}} Bed</span> }
        @if (p().baths) { <span><ec-icon name="bath" [size]="16"/> {{p().baths}} Bath</span> }
        @if (p().area) { <span><ec-icon name="area" [size]="16"/> {{p().area}} sq ft</span> }
        <span class="go" aria-hidden="true"><ec-icon name="arrowUR" [size]="18"/></span>
      </div>
    </div>
  </a>`,
  styles: [`
  :host{display:block;perspective:1100px}
  .card{display:block;background:#fff;border-radius:var(--r-lg);border:1px solid var(--line);overflow:hidden;position:relative;
    transition:transform .5s var(--ease),box-shadow .5s var(--ease),border-color .3s}
  .card:hover{box-shadow:var(--shadow);transform:translateY(-4px)}
  .media{position:relative;aspect-ratio:4/3.1;overflow:hidden;background:var(--sand-2)}
  .slides{position:absolute;inset:0}
  .s{position:absolute;inset:0;opacity:0;transition:opacity .7s ease;transform:scale(1.001)}
  .s.on{opacity:1}
  .card:hover .s.on{transform:scale(1.07);transition:opacity .7s ease,transform 5s linear}
  .s{transition:opacity .7s ease,transform 1s var(--ease)}
  .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,26,43,.38) 0%,transparent 34%,transparent 62%,rgba(16,26,43,.42) 100%);pointer-events:none}
  .glare{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .4s;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.28),transparent 55%)}
  .card:hover .glare{opacity:1}
  .top{position:absolute;inset:12px 12px auto 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
  .cat{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);padding:6px 11px 6px 9px;border-radius:999px;font-size:12px;font-weight:700;color:var(--ink)}
  .heart{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);display:grid;place-items:center;color:var(--ink);transition:transform .35s var(--ease),background .25s,color .25s}
  .heart:hover{transform:scale(1.12)}
  .heart.on{background:var(--ember);color:#fff;animation:beat .5s var(--ease)}
  @keyframes beat{40%{transform:scale(1.3)}}
  .dots{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:5px}
  .dots i{width:6px;height:6px;border-radius:99px;background:rgba(255,255,255,.55);transition:all .35s var(--ease)}.dots i.on{width:20px;background:#fff}
  .flag{position:absolute;left:12px;bottom:12px;background:var(--gold);color:var(--ink);font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px}
  .dots + .flag{bottom:30px}
  .flag.rent{background:var(--ink);color:#fff}
  .rented .media ec-img{filter:grayscale(.55) brightness(.9)}
  .body{padding:18px 20px 18px;display:grid;gap:6px}
  .price{display:flex;align-items:baseline;gap:6px}
  .price b{font-family:var(--font-display);font-size:27px;font-weight:600;letter-spacing:-.02em}
  .price span{color:var(--ink-3);font-size:14px}
  h3{font-family:var(--font-ui);font-size:16.5px;font-weight:600;letter-spacing:0;line-height:1.3;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
  .loc{display:flex;align-items:center;gap:5px;color:var(--ink-3);font-size:14px}
  .facts{display:flex;align-items:center;gap:12px;margin-top:10px;padding-top:13px;border-top:1px dashed var(--line);font-size:13.5px;color:var(--ink-2);font-weight:500}
  .facts span{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  .go{margin-left:auto;width:36px;height:36px;border-radius:50%;background:var(--sand);display:grid!important;place-items:center;transition:all .4s var(--ease)}
  .card:hover .go{background:var(--ember);color:#fff;transform:rotate(45deg)}
  `]
})
export class Card implements OnDestroy {
  p = input.required<Property>();
  favs = inject(FavoritesService);
  private toast = inject(ToastService);
  icons = CATEGORY_ICON;
  idx = signal(0);
  money = rupees; unit = unitOf;
  private timer: any;

  imgs() { return this.p().images.slice(0, 5); }

  startCycle() {
    if (this.imgs().length < 2 || this.timer) return;
    this.idx.set(1);
    this.timer = setInterval(() => this.idx.update(i => (i + 1) % this.imgs().length), 1300);
  }
  stopCycle() { clearInterval(this.timer); this.timer = null; this.idx.set(0); }
  ngOnDestroy() { clearInterval(this.timer); }

  toggle(e: Event) {
    e.preventDefault(); e.stopPropagation();
    const on = this.favs.toggle(this.p().id);
    this.toast.info(on ? 'Saved to your shortlist' : 'Removed from saved');
  }
}
