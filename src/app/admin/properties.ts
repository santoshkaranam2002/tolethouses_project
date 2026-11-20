import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { MetaService } from '../core/services/meta.service';
import { ToastService } from '../core/services/toast.service';
import { ConfirmService } from '../core/ui/confirm';
import { Paged, Property } from '../core/models';
import { Icon } from '../core/ui/icon';
import { Img } from '../core/ui/img';
import { rupees } from '../core/format';
import { ADMIN_CSS } from './admin-css';
import { PropertyForm } from './property-form';

@Component({
  selector: 'ec-admin-properties', standalone: true, imports: [FormsModule, RouterLink, Icon, Img, PropertyForm],
  template: `
  <div class="ph"><div><h1>Properties</h1><p>{{data() ? data()!.total : '…'}} listing{{data()?.total === 1 ? '' : 's'}} · add, edit, feature or mark rented.</p></div>
    <button class="btn ember" (click)="openForm(null)"><ec-icon name="plus" [size]="18"/> Add property</button></div>

  <div class="tools">
    <input class="input grow" type="search" placeholder="Search title, area or city…" [ngModel]="q()" (ngModelChange)="q.set($event); q$.next($event)" aria-label="Search properties"/>
    <select class="select" [ngModel]="cat()" (ngModelChange)="cat.set($event); reload(1)" aria-label="Filter by type"><option value="">All types</option>@for (c of meta.categories(); track c.key) { <option [value]="c.key">{{c.label}}</option> }</select>
    <select class="select" [ngModel]="status()" (ngModelChange)="status.set($event); reload(1)" aria-label="Filter by status"><option value="">Any status</option><option>Available</option><option>Rented</option></select>
  </div>

  <section class="panel">
    @if (error()) { <div class="errbar"><ec-icon name="alert" [size]="18"/> {{error()}} <button (click)="reload()">Retry</button></div> }
    @if (!data() && !error()) { <div class="skrows">@for (i of [1,2,3,4,5]; track i) { <div class="skel"></div> }</div> }
    @else if (data() && !data()!.items.length) { <div class="empty"><ec-icon name="home" [size]="34"/><h3>No properties found</h3><p>Try different filters, or add your first listing.</p></div> }
    @else if (data()) {
      <div class="scroll"><table class="tbl rt">
        <thead><tr><th>Property</th><th>Type</th><th>Rent</th><th>Location</th><th>Status</th><th>Featured</th><th></th></tr></thead>
        <tbody>
          @for (p of data()!.items; track p.id) {
            <tr [class.busy]="busyId() === p.id">
              <td><div class="pc"><a class="thumb" [routerLink]="['/homes', p.id]"><ec-img [src]="p.images[0]" [seed]="p.id" label="" [alt]="p.title"/></a><div><b>{{p.title}}</b><small>{{p.beds}} bed · {{p.baths}} bath · {{p.area}} sq ft</small></div></div></td>
              <td data-l="Type">{{p.categoryLabel}}</td>
              <td data-l="Rent"><b>{{money(p.price)}}</b></td>
              <td data-l="Location">{{p.location ? p.location + ', ' : ''}}{{p.city}}</td>
              <td data-l="Status"><button class="st tog" [class.ok]="p.status==='Available'" [class.warn]="p.status==='Rented'" (click)="toggleStatus(p)" [title]="'Mark as ' + (p.status === 'Available' ? 'rented' : 'available')">{{p.status}}</button></td>
              <td data-l="Featured"><button class="ibtn" [class.on]="p.featured" (click)="toggleFeatured(p)" [attr.aria-label]="p.featured ? 'Unfeature' : 'Feature'"><ec-icon name="star" [size]="20" [fill]="p.featured"/></button></td>
              <td class="acts"><button class="ibtn" (click)="openForm(p)" aria-label="Edit"><ec-icon name="edit" [size]="18"/></button><button class="ibtn del" (click)="remove(p)" aria-label="Delete"><ec-icon name="trash" [size]="18"/></button></td>
            </tr>
          }
        </tbody></table></div>
      @if (data()!.pages > 1) {
        <div class="pgr"><button [disabled]="data()!.page <= 1" (click)="reload(data()!.page - 1)" aria-label="Previous"><ec-icon name="chevL" [size]="16"/></button>
          @for (n of pages(); track n) { <button [class.on]="n === data()!.page" (click)="reload(n)">{{n}}</button> }
          <button [disabled]="data()!.page >= data()!.pages" (click)="reload(data()!.page + 1)" aria-label="Next"><ec-icon name="chevR" [size]="16"/></button></div>
      }
    }
  </section>

  @if (form() !== undefined) { <ec-property-form [property]="form()!" (close)="form.set(undefined)" (saved)="onSaved()"/> }`,
  styles: [ADMIN_CSS + `.pc{display:flex;gap:14px;align-items:center;min-width:260px}.pc b{display:block}.pc small{color:var(--ink-3)}.tog{cursor:pointer;transition:transform .2s}.tog:hover{transform:scale(1.06)}.acts{white-space:nowrap;text-align:right}tr.busy{opacity:.5;pointer-events:none}.empty h3{font-size:24px;color:var(--ink)}
  @media(max-width:760px){.acts{text-align:left;padding-top:8px!important}.pc{min-width:0}}`]
})
export class AdminProperties implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  meta = inject(MetaService);
  money = rupees;

  data = signal<Paged<Property> | null>(null);
  error = signal('');
  q = signal(''); cat = signal(''); status = signal('');
  q$ = new Subject<string>();
  form = signal<Property | null | undefined>(undefined);   // undefined = closed, null = add, Property = edit
  busyId = signal(0);
  private page = 1;
  private req = 0;
  pages = computed(() => Array.from({ length: this.data()?.pages ?? 0 }, (_, i) => i + 1));

  constructor() {
    this.q$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reload(1));
  }
  ngOnInit() {
    this.meta.load();
    this.reload(1);
    if (this.route.snapshot.queryParamMap.get('add')) { this.form.set(null); this.router.navigate([], { queryParams: { add: null }, queryParamsHandling: 'merge', replaceUrl: true }); }
  }

  reload(page = this.page) {
    this.page = page; this.error.set('');
    const id = ++this.req;   // ignore out-of-order responses
    this.api.properties({ all: 1, _t: Date.now(), q: this.q().trim(), category: this.cat(), status: this.status(), page: String(page) } as any, 10).subscribe({
      next: r => { if (id === this.req) this.data.set(r); },
      error: e => { if (id === this.req) this.error.set(e.message); }
    });
  }
  openForm(p: Property | null) { this.form.set(p); }
  /** After a save, fetch the fresh list from the API so the change shows straight away. */
  onSaved() { this.form.set(undefined); this.reload(); this.meta.load(true); }

  private patch(p: Property, body: Record<string, unknown>, msg: string) {
    this.busyId.set(p.id);
    this.api.updateProperty(p.id, body).subscribe({
      next: r => { this.busyId.set(0); this.data.update(d => d && ({ ...d, items: d.items.map(x => x.id === r.id ? r : x) })); this.toast.success(msg); this.meta.load(true); },
      error: e => { this.busyId.set(0); this.toast.error(e.message); }
    });
  }
  toggleStatus(p: Property) { const s = p.status === 'Available' ? 'Rented' : 'Available'; this.patch(p, { status: s }, `Marked as ${s.toLowerCase()}`); }
  toggleFeatured(p: Property) { this.patch(p, { featured: !p.featured }, p.featured ? 'Removed from featured' : 'Now featured on the homepage'); }

  async remove(p: Property) {
    if (!await this.confirm.open('Delete this property?', `“${p.title}” will be removed permanently, along with its listing page.`, 'Delete', true)) return;
    this.busyId.set(p.id);
    this.api.deleteProperty(p.id).subscribe({
      next: () => {
        this.busyId.set(0); this.toast.success('Property deleted');
        const last = (this.data()?.items.length ?? 0) <= 1 && this.page > 1;
        this.reload(last ? this.page - 1 : this.page); this.meta.load(true);
      },
      error: e => { this.busyId.set(0); this.toast.error(e.message); }
    });
  }
}
