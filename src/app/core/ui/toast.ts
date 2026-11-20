import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { Icon } from './icon';

@Component({
  selector: 'ec-toasts', standalone: true, imports: [Icon],
  template: `<div class="stack" role="status" aria-live="polite">
    @for (t of toast.items(); track t.id) {
      <div class="t {{t.kind}}"><ec-icon [name]="t.kind === 'success' ? 'check' : t.kind === 'error' ? 'alert' : 'sparkles'" [size]="18"/><span>{{t.text}}</span>
        <button (click)="toast.dismiss(t.id)" aria-label="Dismiss"><ec-icon name="close" [size]="14"/></button></div>
    }</div>`,
  styles: [`.stack{position:fixed;z-index:400;left:50%;bottom:calc(88px + env(safe-area-inset-bottom));transform:translateX(-50%);display:grid;gap:8px;width:min(440px,calc(100vw - 28px));pointer-events:none}
    @media(min-width:900px){.stack{bottom:28px}}
    .t{pointer-events:auto;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;background:var(--ink);color:#fff;box-shadow:var(--shadow-lg);font-size:14px;animation:tin .4s cubic-bezier(.2,.8,.2,1)}
    .t span{flex:1}.t.success ec-icon:first-child{color:#7fe0a8}.t.error{background:#7a1f12}.t.error ec-icon:first-child{color:#ffc2b4}
    .t button{color:inherit;opacity:.6;padding:4px;border-radius:8px}.t button:hover{opacity:1}
    @keyframes tin{from{opacity:0;transform:translateY(14px) scale(.96)}}`]
})
export class Toasts { toast = inject(ToastService); }
