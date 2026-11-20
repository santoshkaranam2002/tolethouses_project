import { Component, input } from '@angular/core';

@Component({
  selector: 'ec-logo', standalone: true,
  template: `<svg viewBox="0 0 32 32" [attr.width]="size()" [attr.height]="size()" aria-hidden="true"><path d="M4 30V14C4 7 9.400 2 16 2s12 5 12 12v16z" [attr.fill]="dark() ? '#fff' : '#101a2b'"/><path d="M11 30V17.500a5 5 0 0 1 10 0V30z" fill="#e9a23b"/></svg>
    <span class="w" [class.dark]="dark()">Estate<em>Craft</em></span>`,
  styles: [`:host{display:inline-flex;align-items:center;gap:10px}.w{font-family:var(--font-display);font-size:23px;font-weight:600;letter-spacing:-.02em;color:var(--ink)}.w em{font-style:italic;font-weight:500;color:var(--ember)}.w.dark{color:#fff}`]
})
export class Logo { size = input(30); dark = input(false); }
