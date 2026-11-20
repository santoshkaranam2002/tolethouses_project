import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { Icon } from '../core/ui/icon';
import { ConfirmHost } from '../core/ui/confirm';
import { Logo } from '../shared/logo';

@Component({
  selector: 'ec-admin-shell', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, ConfirmHost, Logo],
  template: `
  <header class="bar">
    <div class="wrap in">
      <a routerLink="/admin" class="brand"><ec-logo [size]="28"/><span class="chip ink">Admin</span></a>
      <nav aria-label="Admin sections">
        @for (t of tabs; track t.path) {
          <a [routerLink]="t.path ? ['/admin', t.path] : ['/admin']" routerLinkActive="on" [routerLinkActiveOptions]="{exact: !t.path}"><ec-icon [name]="t.icon" [size]="18"/><span>{{t.label}}</span></a>
        }
      </nav>
      <div class="r"><a routerLink="/" class="btn ghost sm site"><ec-icon name="globe" [size]="16"/> View site</a><button class="icon-btn" (click)="auth.logout()" aria-label="Log out" title="Log out"><ec-icon name="logout" [size]="20"/></button></div>
    </div>
  </header>
  <main class="wrap page"><router-outlet /></main>
  <ec-confirm />`,
  styles: [`:host{display:block;min-height:100vh;background:var(--sand)}
  .bar{position:sticky;top:0;z-index:90;background:rgba(255,253,248,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
  .in{display:flex;align-items:center;gap:22px;min-height:68px}.brand{display:flex;align-items:center;gap:12px}
  nav{display:flex;gap:4px;flex:1;overflow-x:auto;scrollbar-width:none}nav::-webkit-scrollbar{display:none}
  nav a{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:99px;font-weight:600;font-size:14.5px;color:var(--ink-3);white-space:nowrap;transition:all .25s}nav a:hover{background:var(--sand);color:var(--ink)}nav a.on{background:var(--ink);color:#fff}
  .r{display:flex;align-items:center;gap:6px}.page{padding:34px 0 80px;animation:fadein .5s ease backwards}
  @media(max-width:860px){.in{flex-wrap:wrap;gap:6px;padding-top:8px}nav{order:3;flex-basis:100%;padding-bottom:8px}.site{display:none}.page{padding-top:22px}}`]
})
export class AdminShell {
  auth = inject(AuthService);
  tabs = [
    { path: '', label: 'Overview', icon: 'dash' }, { path: 'properties', label: 'Properties', icon: 'home' },
    { path: 'enquiries', label: 'Enquiries', icon: 'inbox' }, { path: 'customers', label: 'Customers', icon: 'users' },
    { path: 'locations', label: 'Locations', icon: 'pin' },
  ];
}
