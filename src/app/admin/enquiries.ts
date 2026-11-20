import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { MetaService } from '../core/services/meta.service';
import { ToastService } from '../core/services/toast.service';
import { ConfirmService } from '../core/ui/confirm';
import { Enquiry } from '../core/models';
import { Icon } from '../core/ui/icon';
import { ADMIN_CSS } from './admin-css';

@Component({
  selector: 'ec-admin-enquiries', standalone: true, imports: [FormsModule, RouterLink, Icon],
  template: `
  <div class="ph"><div><h1>Enquiries</h1><p>{{items() ? items()!.length : '…'}} total · move each one through the pipeline.</p></div></div>
  <div class="tools">
    <div class="pills" role="tablist">
      <button [class.on]="!filter()" (click)="filter.set('')">All <small>{{items()?.length ?? 0}}</small></button>
      @for (s of statuses(); track s) { <button [class.on]="filter() === s" (click)="filter.set(s)">{{s}} <small>{{count(s)}}</small></button> }
    </div>
  </div>
  <section class="panel">
    @if (error()) { <div class="errbar"><ec-icon name="alert" [size]="18"/> {{error()}} <button (click)="load()">Retry</button></div> }
    @if (!items() && !error()) { <div class="skrows">@for (i of [1,2,3,4]; track i) { <div class="skel"></div> }</div> }
    @else if (items() && !shown().length) { <div class="empty"><ec-icon name="inbox" [size]="34"/><p>No enquiries {{filter() ? 'with this status' : 'yet'}}.</p></div> }
    @else if (items()) {
      <div class="scroll"><table class="tbl rt"><thead><tr><th>From</th><th>Property</th><th>Message</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>
        @for (e of shown(); track e.id) {
          <tr [class.busy]="busyId() === e.id">
            <td><b>{{e.name}}</b><small class="sm"><a [href]="'tel:' + e.phone">{{e.phone}}</a>@if (e.customerId) { · account }@else { · guest }</small></td>
            <td data-l="Property"><a class="pl" [routerLink]="['/homes', e.propertyId]">{{e.propertyTitle}}</a></td>
            <td data-l="Message" class="msg">{{e.message || '—'}}</td>
            <td data-l="Date">{{e.date}}</td>
            <td data-l="Status"><select class="select ss" [ngModel]="e.status" (ngModelChange)="setStatus(e, $event)" [attr.aria-label]="'Status for ' + e.name">@for (s of statuses(); track s) { <option [value]="s">{{s}}</option> }</select></td>
            <td class="acts"><a class="ibtn" [href]="'tel:' + e.phone" aria-label="Call"><ec-icon name="phone" [size]="18"/></a><button class="ibtn del" (click)="remove(e)" aria-label="Delete"><ec-icon name="trash" [size]="18"/></button></td>
          </tr>
        }</tbody></table></div>
    }
  </section>`,
  styles: [ADMIN_CSS + `.pills{display:flex;gap:8px;flex-wrap:wrap}.pills button{padding:9px 16px;border-radius:99px;border:1.5px solid var(--line);background:#fff;font-weight:600;font-size:14px;transition:all .25s}.pills button:hover{border-color:var(--ink)}.pills button.on{background:var(--ink);color:#fff;border-color:var(--ink)}.pills small{opacity:.6;margin-left:3px}
  .sm{display:block;color:var(--ink-3);font-size:13px}.sm a{color:var(--sea);font-weight:600}.pl{font-weight:600}.pl:hover{color:var(--ember)}.msg{max-width:280px;color:var(--ink-2)}.ss{min-height:40px;border-radius:99px;font-weight:600;min-width:160px;font-size:14px}.acts{white-space:nowrap;text-align:right}tr.busy{opacity:.5;pointer-events:none}
  @media(max-width:760px){.acts{text-align:left}.msg{max-width:none}}`]
})
export class AdminEnquiries implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private meta = inject(MetaService);
  items = signal<Enquiry[] | null>(null);
  error = signal('');
  filter = signal('');
  busyId = signal(0);
  statuses = computed(() => this.meta.meta()?.enquiryStatuses ?? ['New', 'Contacted', 'Interested', 'Visit Scheduled', 'Completed', 'Closed']);
  shown = computed(() => (this.items() ?? []).filter(e => !this.filter() || e.status === this.filter()));
  count(s: string) { return (this.items() ?? []).filter(e => e.status === s).length; }

  ngOnInit() { this.meta.load(); this.load(); }
  load() { this.error.set(''); this.api.enquiries().subscribe({ next: r => this.items.set(r), error: e => this.error.set(e.message) }); }

  setStatus(e: Enquiry, status: string) {
    if (status === e.status) return;
    this.busyId.set(e.id);
    this.api.updateEnquiry(e.id, { status }).subscribe({
      next: r => { this.busyId.set(0); this.items.update(l => l?.map(x => x.id === r.id ? r : x) ?? null); this.toast.success(`Marked as ${status}`); },
      error: er => { this.busyId.set(0); this.toast.error(er.message); this.items.update(l => l ? [...l] : l); }
    });
  }
  async remove(e: Enquiry) {
    if (!await this.confirm.open('Delete this enquiry?', `The enquiry from ${e.name} will be removed permanently.`, 'Delete', true)) return;
    this.busyId.set(e.id);
    this.api.deleteEnquiry(e.id).subscribe({
      next: () => { this.busyId.set(0); this.items.update(l => l?.filter(x => x.id !== e.id) ?? null); this.toast.success('Enquiry deleted'); },
      error: er => { this.busyId.set(0); this.toast.error(er.message); }
    });
  }
}
