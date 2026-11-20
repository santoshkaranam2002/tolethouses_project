import { Component, Injectable, inject, signal } from '@angular/core';
import { Icon } from './icon';

interface Ask { title: string; body: string; confirm: string; danger: boolean; resolve: (ok: boolean) => void; }

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly ask = signal<Ask | null>(null);
  open(title: string, body: string, confirm = 'Confirm', danger = false): Promise<boolean> {
    return new Promise(resolve => this.ask.set({ title, body, confirm, danger, resolve }));
  }
  answer(ok: boolean) { this.ask()?.resolve(ok); this.ask.set(null); }
}

@Component({
  selector: 'ec-confirm', standalone: true, imports: [Icon],
  template: `@if (svc.ask(); as a) {
    <div class="scrim" (click)="svc.answer(false)"></div>
    <div class="dlg" role="alertdialog" aria-modal="true" [attr.aria-label]="a.title">
      <span class="ic" [class.danger]="a.danger"><ec-icon [name]="a.danger ? 'trash' : 'alert'" [size]="26"/></span>
      <h3>{{a.title}}</h3><p>{{a.body}}</p>
      <div class="b"><button class="btn ghost" (click)="svc.answer(false)">Cancel</button><button class="btn" [class.ember]="a.danger" (click)="svc.answer(true)">{{a.confirm}}</button></div>
    </div>}`,
  styles: [`.scrim{position:fixed;inset:0;background:rgba(16,26,43,.55);z-index:600;backdrop-filter:blur(3px);animation:f .25s}
  .dlg{position:fixed;z-index:610;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100vw - 32px));background:#fff;border-radius:26px;padding:30px;text-align:center;box-shadow:var(--shadow-lg);animation:p .35s var(--ease);display:grid;gap:10px;justify-items:center}
  .ic{width:60px;height:60px;border-radius:50%;background:var(--gold-soft);color:#8a5a10;display:grid;place-items:center}.ic.danger{background:#fde2dc;color:var(--bad)}
  h3{font-size:26px}p{color:var(--ink-3)}.b{display:flex;gap:10px;margin-top:10px;width:100%}.b .btn{flex:1}
  @keyframes f{from{opacity:0}}@keyframes p{from{opacity:0;transform:translate(-50%,-46%) scale(.95)}}`]
})
export class ConfirmHost { svc = inject(ConfirmService); }
