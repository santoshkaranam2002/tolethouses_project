import { Injectable, signal } from '@angular/core';

export interface ToastMsg { id: number; kind: 'success' | 'error' | 'info'; text: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly items = signal<ToastMsg[]>([]);
  private n = 0;
  show(kind: ToastMsg['kind'], text: string, ms = 4200) {
    const id = ++this.n;
    this.items.update(l => [...l.slice(-3), { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
  success(t: string) { this.show('success', t); }
  error(t: string) { this.show('error', t, 6000); }
  info(t: string) { this.show('info', t); }
  dismiss(id: number) { this.items.update(l => l.filter(i => i.id !== id)); }
}
