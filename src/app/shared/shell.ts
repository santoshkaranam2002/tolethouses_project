import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { MetaService } from '../core/services/meta.service';
import { FavoritesService } from '../core/services/favorites.service';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { ConfirmHost, ConfirmService } from '../core/ui/confirm';
import { Icon, CATEGORY_ICON } from '../core/ui/icon';
import { Logo } from './logo';

@Component({
  selector: 'ec-shell', standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo, ConfirmHost],
  template: `
  <header class="nav" [class.scrolled]="scrolled()" [class.hide]="hidden()">
    <div class="wrap bar">
      <a routerLink="/" class="brand" aria-label="EstateCraft home"><ec-logo /></a>

      <nav class="links" aria-label="Main">
        <a routerLink="/homes" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}">All homes</a>
        <a routerLink="/nearby" routerLinkActive="on">Nearby</a>
        <div class="dd" (mouseenter)="menu.set(true)" (mouseleave)="menu.set(false)">
          <button class="ddbtn" [class.on]="menu()" (click)="menu.set(true); $event.stopPropagation()" aria-haspopup="true" [attr.aria-expanded]="menu()">Browse by type <ec-icon name="chevD" [size]="15"/></button>
          @if (menu()) {
            <div class="panel">
              @for (c of meta.categories(); track c.key) {
                <a [routerLink]="['/homes']" [queryParams]="{category: c.key}" (click)="menu.set(false)">
                  <span class="ic"><ec-icon [name]="icon[c.key]" [size]="20"/></span>
                  <span><b>{{c.label}}</b><small>{{c.blurb}}</small></span>
                </a>
              }
            </div>
          }
        </div>
        <a routerLink="/saved" routerLinkActive="on">Saved @if (favs.count()) { <i class="badge">{{favs.count()}}</i> }</a>
        @if (auth.loggedIn() && !auth.isAdmin()) { <a routerLink="/enquiries" routerLinkActive="on">My enquiries</a> }
      </nav>

      <div class="right">
        @if (auth.loggedIn()) {
          <div class="dd" (mouseenter)="umenu.set(true)" (mouseleave)="umenu.set(false)">
            <button class="avatar" (click)="umenu.set(true); $event.stopPropagation()" [attr.aria-label]="'Account menu for ' + auth.user()!.name">{{initial()}}</button>
            @if (umenu()) {
              <div class="panel user">
                <div class="who"><b>{{auth.user()!.name}}</b><small>{{auth.user()!.email}}</small></div>
                @if (auth.isAdmin()) { <a routerLink="/admin" (click)="umenu.set(false)"><ec-icon name="dash" [size]="18"/> Admin console</a> }
                @else { <a routerLink="/enquiries" (click)="umenu.set(false)"><ec-icon name="inbox" [size]="18"/> My enquiries</a> }
                <a routerLink="/saved" (click)="umenu.set(false)"><ec-icon name="heart" [size]="18"/> Saved homes</a>
                <button (click)="umenu.set(false); auth.logout()"><ec-icon name="logout" [size]="18"/> Log out</button>
                @if (!auth.isAdmin()) { <button class="danger" (click)="umenu.set(false); deleteAccount()"><ec-icon name="trash" [size]="18"/> Delete account</button> }
              </div>
            }
          </div>
        } @else {
          <a routerLink="/login" class="login">Log in</a>
          <a routerLink="/signup" class="btn sm">Sign up</a>
        }
        <button class="icon-btn burger" (click)="open.set(true)" aria-label="Open menu"><ec-icon name="menu" [size]="24"/></button>
      </div>
    </div>
  </header>

  <!-- mobile full-screen menu -->
  <div class="sheet" [class.open]="open()" [attr.inert]="open() ? null : ''">
    <div class="sh-top"><ec-logo /><button class="icon-btn" (click)="open.set(false)" aria-label="Close menu"><ec-icon name="close" [size]="24"/></button></div>
    <div class="sh-body">
      <a routerLink="/homes" class="big" (click)="open.set(false)">All homes</a>
      <a routerLink="/nearby" class="big" (click)="open.set(false)">Homes near me</a>
      @for (c of meta.categories(); track c.key) {
        <a [routerLink]="['/homes']" [queryParams]="{category:c.key}" class="row" (click)="open.set(false)"><ec-icon [name]="icon[c.key]" [size]="22"/> {{c.label}} <small>{{c.count}}</small></a>
      }
      <a routerLink="/saved" class="big" (click)="open.set(false)">Saved homes @if (favs.count()) { <i class="badge">{{favs.count()}}</i> }</a>
      @if (auth.loggedIn()) {
        @if (auth.isAdmin()) { <a routerLink="/admin" class="big" (click)="open.set(false)">Admin console</a> }
        @else { <a routerLink="/enquiries" class="big" (click)="open.set(false)">My enquiries</a> }
        <button class="big" (click)="open.set(false); auth.logout()">Log out</button>
        @if (!auth.isAdmin()) { <button class="row danger" (click)="open.set(false); deleteAccount()"><ec-icon name="trash" [size]="22"/> Delete account</button> }
      } @else {
        <div class="sh-cta"><a routerLink="/login" class="btn ghost" (click)="open.set(false)">Log in</a><a routerLink="/signup" class="btn ember" (click)="open.set(false)">Create account</a></div>
      }
    </div>
  </div>

  <main class="page"><router-outlet /></main>
  <ec-confirm />

  <footer class="foot">
    <div class="wrap">
      <div class="ftop">
        <div class="fbrand"><ec-logo [dark]="true" [size]="34"/><p>Rent a place that feels like home. Hand-checked listings across Visakhapatnam — and more cities soon.</p></div>
        <div class="fcol"><h5>Browse</h5>@for (c of meta.categories(); track c.key) { <a [routerLink]="['/homes']" [queryParams]="{category:c.key}">{{c.label}}</a> }</div>
        <div class="fcol"><h5>Cities</h5>@for (c of meta.cities(); track c.id) { <a [routerLink]="['/homes']" [queryParams]="{city:c.name}">{{c.name}}</a> }
          <span class="soon">More cities coming soon</span></div>
        <div class="fcol"><h5>Account</h5>
          @if (auth.loggedIn()) { <a routerLink="/saved">Saved homes</a> @if (!auth.isAdmin()) { <a routerLink="/enquiries">My enquiries</a> } }
          @else { <a routerLink="/login">Log in</a><a routerLink="/signup">Create account</a> }
        </div>
      </div>
      <div class="fbot"><span>© {{year}} EstateCraft. All rights reserved.</span><span>Made for Vizag, built to grow.</span></div>
    </div>
  </footer>

  <!-- mobile bottom tabs -->
  <nav class="tabs" aria-label="Quick navigation">
    <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}"><ec-icon name="home" [size]="22"/><span>Home</span></a>
    <a routerLink="/homes" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}"><ec-icon name="search" [size]="22"/><span>Search</span></a>
    <a routerLink="/saved" routerLinkActive="on"><span class="ti"><ec-icon name="heart" [size]="22"/>@if (favs.count()) { <i class="badge">{{favs.count()}}</i> }</span><span>Saved</span></a>
    @if (auth.loggedIn()) { <a [routerLink]="auth.isAdmin() ? '/admin' : '/enquiries'" routerLinkActive="on"><ec-icon [name]="auth.isAdmin() ? 'dash' : 'inbox'" [size]="22"/><span>{{auth.isAdmin() ? 'Admin' : 'Enquiries'}}</span></a> }
    @else { <a routerLink="/login" routerLinkActive="on"><ec-icon name="user" [size]="22"/><span>Log in</span></a> }
  </nav>
  `,
  styles: [`
  :host{display:block}
  .nav{position:fixed;inset:0 0 auto 0;z-index:100;height:var(--nav-h);display:flex;align-items:center;transition:background .35s,box-shadow .35s,transform .4s var(--ease)}
  .nav.scrolled{background:rgba(255,253,248,.82);backdrop-filter:saturate(1.6) blur(18px);-webkit-backdrop-filter:saturate(1.6) blur(18px);box-shadow:0 1px 0 var(--line)}
  .bar{display:flex;align-items:center;justify-content:space-between;gap:20px}
  .links{display:flex;align-items:center;gap:6px;margin-left:12px}
  .links a,.ddbtn{padding:10px 14px;border-radius:999px;font-weight:600;font-size:15px;color:var(--ink-2);display:inline-flex;align-items:center;gap:6px;position:relative;transition:background .2s,color .2s}
  .links a:hover,.ddbtn:hover,.ddbtn.on{background:var(--sand);color:var(--ink)}
  .links a.on{color:var(--ink);background:var(--sand)}
  .badge{font-style:normal;font-size:11px;font-weight:700;background:var(--ember);color:#fff;border-radius:999px;min-width:19px;height:19px;display:inline-grid;place-items:center;padding:0 5px}
  .right{display:flex;align-items:center;gap:8px}
  .login{font-weight:600;font-size:15px;padding:10px 14px;border-radius:999px}.login:hover{background:var(--sand)}
  .dd{position:relative}
  .panel{position:absolute;top:calc(100% + 4px);left:0;min-width:340px;background:#fff;border-radius:20px;box-shadow:var(--shadow-lg);padding:10px;border:1px solid var(--line);animation:pop .28s var(--ease);z-index:5}
  .panel::before{content:'';position:absolute;inset:-14px 0 100% 0;height:14px}
  .panel a,.panel button{display:flex;align-items:center;gap:14px;padding:11px 12px;border-radius:14px;width:100%;text-align:left;font-weight:500;transition:background .2s}
  .panel a:hover,.panel button:hover{background:var(--sand)}
  .panel .ic{width:42px;height:42px;border-radius:12px;background:var(--gold-soft);display:grid;place-items:center;color:var(--ember-2);flex:none;transition:transform .3s var(--ease)}
  .panel a:hover .ic{transform:rotate(-8deg) scale(1.08)}
  .panel b{display:block;font-size:15px}.panel small{display:block;color:var(--ink-3);font-size:12.5px;line-height:1.35}
  .panel.user{left:auto;right:0;min-width:240px}.panel.user a,.panel.user button{gap:10px;font-size:15px}
  .who{padding:10px 12px 12px;border-bottom:1px solid var(--line);margin-bottom:6px}.who b{display:block}.who small{color:var(--ink-3)}
  @keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}}
  .avatar{width:44px;height:44px;border-radius:50%;background:var(--ink);color:#fff;font-weight:700;font-family:var(--font-display);font-size:18px;transition:transform .3s var(--ease),box-shadow .3s}
  .avatar:hover{transform:scale(1.07);box-shadow:0 0 0 4px var(--gold-soft)}
  .panel .danger{color:var(--bad)}.panel .danger:hover{background:#fde2dc}.sh-body .danger{color:var(--bad)}
  .burger{display:none}
  .page{min-height:100vh;padding-top:var(--nav-h);animation:fadein .5s ease backwards}

  /* mobile sheet */
  .sheet{position:fixed;inset:0;z-index:300;background:var(--paper);transform:translateY(-100%);visibility:hidden;transition:transform .55s var(--ease),visibility 0s .55s;display:flex;flex-direction:column}
  .sheet.open{transform:none;visibility:visible;transition:transform .55s var(--ease)}
  .sh-top{display:flex;justify-content:space-between;align-items:center;height:var(--nav-h);padding:0 16px}
  .sh-body{padding:8px 20px 40px;overflow:auto;display:grid;align-content:start;gap:2px}
  .sh-body .big{font-family:var(--font-display);font-size:30px;padding:12px 0;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px;text-align:left}
  .sh-body .row{display:flex;align-items:center;gap:12px;padding:12px 4px;font-weight:600;color:var(--ink-2)}.row small{margin-left:auto;color:var(--mute)}
  .sh-cta{display:grid;gap:10px;margin-top:20px}
  .sheet.open .sh-body>*{animation:rise .6s var(--ease) both}
  .sheet.open .sh-body>*:nth-child(2){animation-delay:.05s}.sheet.open .sh-body>*:nth-child(3){animation-delay:.09s}.sheet.open .sh-body>*:nth-child(4){animation-delay:.13s}.sheet.open .sh-body>*:nth-child(5){animation-delay:.17s}.sheet.open .sh-body>*:nth-child(6){animation-delay:.21s}
  @keyframes rise{from{opacity:0;transform:translateY(18px)}}

  /* mobile bottom tabs */
  .tabs{display:none}

  .foot{background:var(--ink);color:#c9d0dc;margin-top:96px;padding:64px 0 28px;position:relative;overflow:hidden;border-radius:32px 32px 0 0}
  .ftop{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px;position:relative;z-index:1;margin-bottom:44px}
  .fbrand p{margin-top:18px;max-width:330px;line-height:1.65;color:#9aa5b8}
  .fcol{display:grid;align-content:start;gap:10px}.fcol h5{margin:0 0 6px;font-family:var(--font-ui);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .fcol a{color:#c9d0dc;width:fit-content;position:relative}.fcol a::after{content:'';position:absolute;left:0;bottom:-2px;height:1px;width:100%;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .35s var(--ease)}.fcol a:hover{color:#fff}.fcol a:hover::after{transform:scaleX(1)}
  .soon{font-size:13px;color:#7c8799;font-style:italic}
  .fword{font-family:var(--font-display);font-weight:600;font-size:clamp(70px,19vw,270px);line-height:.85;letter-spacing:-.05em;text-align:center;margin:56px 0 -.1em;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0));-webkit-background-clip:text;background-clip:text;color:transparent;user-select:none}
  .fbot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13.5px;color:#7c8799;border-top:1px solid rgba(255,255,255,.1);padding-top:22px;position:relative;z-index:1}

  @media (max-width: 960px){
    .links,.login,.right .btn{display:none}.burger{display:inline-grid}
    .ftop{grid-template-columns:1fr 1fr}.fbrand{grid-column:1/-1}
  }
  @media (max-width: 899px){
    :host{--nav-h:64px}
    .page{padding-bottom:84px}
    .foot{margin-top:80px;border-radius:32px 32px 0 0;padding-bottom:110px}
    .tabs{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;z-index:120;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));background:rgba(16,26,43,.94);backdrop-filter:blur(16px);border-radius:24px;padding:8px;box-shadow:var(--shadow-lg)}
    .tabs a{display:grid;justify-items:center;gap:3px;padding:8px 0;border-radius:16px;color:#aab3c3;font-size:11px;font-weight:600;transition:background .25s,color .25s}
    .tabs a.on{background:rgba(255,255,255,.12);color:#fff}
    .tabs .ti{position:relative;display:inline-flex}.tabs .badge{position:absolute;top:-6px;right:-10px;min-width:16px;height:16px;font-size:10px}
  }
  `]
})
export class Shell {
  auth = inject(AuthService);
  meta = inject(MetaService);
  favs = inject(FavoritesService);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  icon = CATEGORY_ICON;
  year = new Date().getFullYear();
  scrolled = signal(false);
  hidden = signal(false);
  open = signal(false);
  menu = signal(false);
  umenu = signal(false);
  initial = computed(() => (this.auth.user()?.name || '?').trim().charAt(0).toUpperCase());
  private lastY = 0;

  constructor() {
    this.meta.load();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { this.menu.set(false); this.umenu.set(false); this.open.set(false); });
    effect(() => document.body.classList.toggle('no-scroll', this.open()));
  }
  async deleteAccount() {
    if (!await this.confirm.open('Delete your account?', 'Your account and the enquiries you sent will be removed permanently. This cannot be undone.', 'Delete account', true)) return;
    this.api.deleteMyAccount().subscribe({
      next: () => { this.auth.logout(); this.toast.success('Your account has been deleted'); },
      error: e => this.toast.error(e.message)
    });
  }
  @HostListener('document:click')
  closeMenus() { this.menu.set(false); this.umenu.set(false); }
  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 12); }
}
