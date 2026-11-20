import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../shared/logo';

@Component({
  selector: 'ec-not-found', standalone: true, imports: [RouterLink, Logo],
  template: `<div class="nf"><a routerLink="/"><ec-logo /></a><div class="n">4<i></i>4</div><h1>This door doesn’t lead anywhere.</h1><p>The page you’re looking for has moved or never existed.</p><a routerLink="/" class="btn ember">Back to homes</a></div>`,
  styles: [`.nf{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:14px;text-align:center;padding:30px;background:var(--sand)}
  .n{font-family:var(--font-display);font-size:clamp(100px,22vw,200px);line-height:1;display:flex;align-items:center;gap:8px;font-weight:600}.n i{width:.5em;height:.78em;background:var(--gold);border-radius:999px 999px 8px 8px;display:block;animation:sway 3s ease-in-out infinite}
  @keyframes sway{50%{transform:translateY(-10px) rotate(-3deg)}}h1{font-size:clamp(26px,4vw,38px)}p{color:var(--ink-3)}`]
})
export class NotFound {}
