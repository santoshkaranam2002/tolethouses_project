import { Component, computed, input, signal } from '@angular/core';
import { placeholderArt } from '../format';

/** Lazy image that fades in when loaded and swaps to a generated placeholder if it fails. */
@Component({
  selector: 'ec-img', standalone: true,
  template: `<img [src]="shown()" [alt]="alt()" [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" [class.ready]="ready()" (load)="ready.set(true)" (error)="onErr()"/>`,
  styles: [`:host{display:block;position:relative;overflow:hidden;background:var(--sand-2)}
    img{display:block;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease, transform .9s cubic-bezier(.2,.7,.2,1)}
    img.ready{opacity:1}`]
})
export class Img {
  src = input<string | null | undefined>('');
  alt = input('');
  seed = input<string | number>('x');
  label = input('');
  eager = input(false);
  private failed = signal(false);
  ready = signal(false);
  shown = computed(() => (!this.src() || this.failed()) ? placeholderArt(this.seed(), this.label()) : this.src()!);
  onErr() { if (!this.failed()) { this.failed.set(true); } }
}
