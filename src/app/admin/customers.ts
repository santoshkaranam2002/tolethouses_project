import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { ConfirmService } from '../core/ui/confirm';
import { AppUser } from '../core/models';
import { Icon } from '../core/ui/icon';
import { ADMIN_CSS } from './admin-css';

@Component({
  selector: 'ec-admin-customers', standalone: true, imports: [FormsModule, Icon],
  template: `
  <div class="ph"><div><h1>Customers</h1><p>{{users() ? users()!.length : '…'}} registered account{{users()?.length === 1 ? '' : 's'}}.</p></div></div>
  <div class="tools"><input class="input grow" type="search" placeholder="Search by name, email or phone…" [ngModel]="q()" (ngModelChange)="q.set($event)" aria-label="Search customers"/></div>
  <section class="panel">
    @if (error()) { <div class="errbar"><ec-icon name="alert" [size]="18"/> {{error()}} <button (click)="load()">Retry</button></div> }
    @if (!users() && !error()) { <div class="skrows">@for (i of [1,2,3,4]; track i) { <div class="skel"></div> }</div> }
    @else if (users() && !shown().length) { <div class="empty"><ec-icon name="users" [size]="34"/><p>No accounts found.</p></div> }
    @else if (users()) {
      <div class="scroll"><table class="tbl rt"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th></th></tr></thead><tbody>
        @for (u of shown(); track u.id) {
          <tr [class.busy]="busyId() === u.id"><td><div class="who"><span class="av">{{u.name.charAt(0) || '?'}}</span><b>{{u.name}}</b></div></td>
            <td data-l="Email"><a [href]="'mailto:' + u.email">{{u.email}}</a></td><td data-l="Phone">{{u.phone || '—'}}</td>
            <td data-l="Role"><span class="st" [class.vio]="u.role==='admin'">{{u.role}}</span></td><td data-l="Joined">{{u.createdDate || '—'}}</td>
            <td class="acts"><button class="ibtn del" (click)="remove(u)" [disabled]="u.id === me()" [attr.aria-label]="'Delete ' + u.name"><ec-icon name="trash" [size]="18"/></button></td></tr>
        }</tbody></table></div>
    }
  </section>`,
  styles: [ADMIN_CSS + `.who{display:flex;gap:12px;align-items:center}.av{width:38px;height:38px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font-family:var(--font-display);font-weight:700}td a{color:var(--sea)}.acts{text-align:right}tr.busy{opacity:.5;pointer-events:none}.ibtn[disabled]{opacity:.3;pointer-events:none}@media(max-width:760px){.acts{text-align:left}}`]
})
export class AdminCustomers implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  users = signal<AppUser[] | null>(null);
  error = signal(''); q = signal(''); busyId = signal(0);
  me = signal(JSON.parse(localStorage.getItem('ec.session') || '{}').id ?? 0);
  shown = computed(() => { const q = this.q().toLowerCase().trim(); return (this.users() ?? []).filter(u => !q || [u.name, u.email, u.phone].some(v => (v || '').toLowerCase().includes(q))); });
  ngOnInit() { this.load(); }
  load() { this.error.set(''); this.api.users().subscribe({ next: r => this.users.set(r), error: e => this.error.set(e.message) }); }
  async remove(u: AppUser) {
    if (!await this.confirm.open('Delete this account?', `${u.name} (${u.email}) will lose access. Their past enquiries stay on record.`, 'Delete account', true)) return;
    this.busyId.set(u.id);
    this.api.deleteUser(u.id).subscribe({
      next: () => { this.busyId.set(0); this.users.update(l => l?.filter(x => x.id !== u.id) ?? null); this.toast.success('Account deleted'); },
      error: e => { this.busyId.set(0); this.toast.error(e.message); }
    });
  }
}
