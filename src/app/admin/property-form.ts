import { Component, computed, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { MetaService } from '../core/services/meta.service';
import { ToastService } from '../core/services/toast.service';
import { Property } from '../core/models';
import { AMENITY_ICON, Icon } from '../core/ui/icon';

const MAX_PHOTOS = 12;
const MAX_MB = 6;

@Component({
  selector: 'ec-property-form', standalone: true, imports: [FormsModule, Icon],
  template: `
  <div class="scrim" (click)="close.emit()"></div>
  <aside class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="edit() ? 'Edit property' : 'Add property'">
    <header><h2>{{edit() ? 'Edit property' : 'Add a property'}}</h2><button class="icon-btn" (click)="close.emit()" aria-label="Close"><ec-icon name="close" [size]="22"/></button></header>
    <form (ngSubmit)="save()" novalidate>
      <div class="body">
        <label class="field full"><span>Title *</span><input class="input" [class.invalid]="tried() && err('title')" name="title" [(ngModel)]="f.title" maxlength="120" placeholder="e.g. Sea-facing 3BHK with balcony"/>@if (tried() && err('title')) { <small class="err">{{err('title')}}</small> }</label>

        <label class="field"><span>Property type *</span><select class="select" name="category" [(ngModel)]="f.category">@for (c of meta.categories(); track c.key) { <option [value]="c.key">{{c.label}}</option> }</select></label>
        <label class="field"><span>Monthly rent (₹) *</span><input class="input" [class.invalid]="tried() && err('price')" name="price" type="number" min="1" [(ngModel)]="f.price" placeholder="25000"/>@if (tried() && err('price')) { <small class="err">{{err('price')}}</small> }</label>

        <label class="field"><span>City *</span><select class="select" name="city" [(ngModel)]="f.city" (ngModelChange)="f.location=''"><option value="">Select city</option>@for (c of meta.cities(); track c.id) { <option [value]="c.name">{{c.name}}</option> }</select>@if (tried() && err('city')) { <small class="err">{{err('city')}}</small> }</label>
        <label class="field"><span>Locality / area</span><input class="input" name="location" [(ngModel)]="f.location" list="areas" placeholder="Start typing…" maxlength="150"/><datalist id="areas">@for (a of areas(); track a) { <option [value]="a"></option> }</datalist></label>

        <label class="field"><span>Bedrooms</span><input class="input" name="beds" type="number" min="0" max="20" [(ngModel)]="f.beds"/></label>
        <label class="field"><span>Bathrooms</span><input class="input" name="baths" type="number" min="0" max="20" [(ngModel)]="f.baths"/></label>
        <label class="field"><span>Area (sq ft)</span><input class="input" name="area" type="number" min="0" [(ngModel)]="f.area"/></label>
        <label class="field"><span>Floor</span><input class="input" name="floor" [(ngModel)]="f.floor" placeholder="e.g. 5th, Ground" maxlength="30"/></label>

        <label class="field"><span>Furnishing</span><select class="select" name="furnishing" [(ngModel)]="f.furnishing">@for (x of meta.furnishing(); track x) { <option [value]="x">{{x}}</option> }</select></label>
        <label class="field"><span>Status</span><select class="select" name="status" [(ngModel)]="f.status"><option>Available</option><option>Rented</option></select></label>

        <label class="field full"><span>Description</span><textarea class="textarea" name="description" [(ngModel)]="f.description" rows="4" placeholder="What makes this home special?"></textarea></label>

        <div class="field full"><span>Amenities</span>
          <div class="am">@for (a of meta.amenities(); track a) { <button type="button" [class.on]="has(a)" (click)="toggle(a)"><ec-icon [name]="icons[a] || 'check'" [size]="16"/> {{a}}</button> }</div></div>

        <label class="field"><span>Latitude <em>(optional)</em></span><input class="input" name="lat" type="number" step="any" [(ngModel)]="f.latitude" placeholder="17.7231"/>@if (tried() && err('latitude')) { <small class="err">{{err('latitude')}}</small> }</label>
        <label class="field"><span>Longitude <em>(optional)</em></span><input class="input" name="lng" type="number" step="any" [(ngModel)]="f.longitude" placeholder="83.3012"/>@if (tried() && err('longitude')) { <small class="err">{{err('longitude')}}</small> }</label>

        <label class="check full"><input type="checkbox" name="featured" [(ngModel)]="f.featured"/><span>Feature this home on the homepage</span></label>

        <div class="field full"><span>Photos <em>({{totalPhotos()}}/{{max}} · JPG, PNG, WebP, up to {{mb}} MB each)</em></span>
          <div class="ph">
            @for (u of existingKept(); track u) { <div class="pv"><img [src]="u" alt="Existing photo"/><button type="button" (click)="removeExisting(u)" aria-label="Remove photo"><ec-icon name="close" [size]="14"/></button></div> }
            @for (n of newFiles(); track n.url) { <div class="pv new"><img [src]="n.url" alt="New photo"/><button type="button" (click)="removeNew(n)" aria-label="Remove photo"><ec-icon name="close" [size]="14"/></button></div> }
            @if (totalPhotos() < max) { <label class="add"><ec-icon name="upload" [size]="22"/><span>Add photos</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden (change)="pick($event)"/></label> }
          </div>
          @if (photoErr()) { <small class="err">{{photoErr()}}</small> }
        </div>
        @if (serverErr()) { <p class="errbox full" role="alert"><ec-icon name="alert" [size]="18"/> {{serverErr()}}</p> }
      </div>
      <footer><button type="button" class="btn ghost" (click)="close.emit()">Cancel</button><button class="btn ember" type="submit" [disabled]="saving()">@if (saving()) { <span class="spin"></span> Saving… } @else { {{edit() ? 'Save changes' : 'Publish property'}} }</button></footer>
    </form>
  </aside>`,
  styles: [`
  .scrim{position:fixed;inset:0;background:rgba(16,26,43,.5);z-index:300;backdrop-filter:blur(3px);animation:f .3s}@keyframes f{from{opacity:0}}
  .drawer{position:fixed;z-index:310;top:0;right:0;bottom:0;width:min(720px,100vw);background:var(--paper);display:flex;flex-direction:column;box-shadow:var(--shadow-lg);animation:s .5s var(--ease)}@keyframes s{from{transform:translateX(100%)}}
  header{display:flex;justify-content:space-between;align-items:center;padding:20px 26px;border-bottom:1px solid var(--line)}h2{font-size:28px}
  form{display:flex;flex-direction:column;min-height:0;flex:1}.body{padding:24px 26px;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:16px;align-content:start;flex:1}.full{grid-column:1/-1}
  footer{padding:16px 26px calc(16px + env(safe-area-inset-bottom));border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:10px;background:#fff}
  em{font-style:normal;font-weight:400;color:var(--mute)}
  .am{display:flex;flex-wrap:wrap;gap:8px}.am button{display:inline-flex;gap:6px;align-items:center;padding:8px 14px;border-radius:99px;border:1.5px solid var(--line);font-size:13.5px;font-weight:600;transition:all .25s;background:#fff}.am button:hover{border-color:var(--ink)}.am button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
  .check{display:flex;gap:10px;align-items:center;font-weight:600;cursor:pointer}.check input{width:20px;height:20px;accent-color:var(--ember)}
  .ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}.pv{position:relative;aspect-ratio:1;border-radius:14px;overflow:hidden;background:var(--sand);animation:pop .4s var(--ease)}.pv img{width:100%;height:100%;object-fit:cover}.pv.new::after{content:'NEW';position:absolute;left:6px;bottom:6px;background:var(--gold);font-size:10px;font-weight:800;padding:2px 7px;border-radius:99px}
  .pv button{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:rgba(16,26,43,.78);color:#fff;display:grid;place-items:center}.pv button:hover{background:var(--bad)}@keyframes pop{from{transform:scale(.8);opacity:0}}
  .add{aspect-ratio:1;border:2px dashed var(--line-2);border-radius:14px;display:grid;place-content:center;justify-items:center;gap:4px;color:var(--ink-3);font-size:13px;font-weight:600;cursor:pointer;transition:all .3s}.add:hover{border-color:var(--ember);color:var(--ember);background:#fff7f3}
  .errbox{display:flex;gap:10px;background:#fdeae6;color:#8f2415;border-radius:14px;padding:12px 14px;margin:0}
  @media(max-width:640px){.body{grid-template-columns:1fr;padding:18px}header,footer{padding-inline:18px}}
  `]
})
export class PropertyForm implements OnInit {
  property = input<Property | null>(null);
  close = output<void>();
  saved = output<Property>();
  private api = inject(ApiService);
  private toast = inject(ToastService);
  meta = inject(MetaService);
  icons = AMENITY_ICON; max = MAX_PHOTOS; mb = MAX_MB;

  edit = computed(() => !!this.property());
  f: any = { title: '', category: 'flat-apartment', price: null, city: '', location: '', beds: 1, baths: 1, area: null, floor: '', furnishing: 'Unfurnished', status: 'Available', description: '', latitude: null, longitude: null, featured: false };
  amenities = signal<string[]>([]);
  existing = signal<string[]>([]);
  removed = signal<string[]>([]);
  newFiles = signal<{ file: File; url: string }[]>([]);
  tried = signal(false); saving = signal(false); serverErr = signal(''); photoErr = signal('');
  existingKept = computed(() => this.existing().filter(u => !this.removed().includes(u)));
  totalPhotos = computed(() => this.existingKept().length + this.newFiles().length);
  areas = computed(() => this.meta.areasOf(this.f.city));

  ngOnInit() {
    this.meta.load();
    const p = this.property();
    if (p) {
      this.f = { title: p.title, category: p.category, price: p.price, city: p.city, location: p.location, beds: p.beds, baths: p.baths, area: p.area, floor: p.floor === '—' ? '' : p.floor, furnishing: p.furnishing, status: p.status, description: p.description, latitude: p.latitude, longitude: p.longitude, featured: p.featured };
      this.amenities.set([...p.amenities]); this.existing.set([...p.images]);
    } else if (this.meta.cities().length === 1) this.f.city = this.meta.cities()[0].name;
  }

  has(a: string) { return this.amenities().includes(a); }
  toggle(a: string) { this.amenities.update(l => l.includes(a) ? l.filter(x => x !== a) : [...l, a]); }
  removeExisting(u: string) { this.removed.update(l => [...l, u]); }
  removeNew(n: { url: string }) { URL.revokeObjectURL(n.url); this.newFiles.update(l => l.filter(x => x.url !== n.url)); }

  pick(ev: Event) {
    const input = ev.target as HTMLInputElement; this.photoErr.set('');
    const ok: { file: File; url: string }[] = [];
    for (const file of Array.from(input.files ?? [])) {
      if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) { this.photoErr.set(`“${file.name}” isn’t a JPG, PNG, WebP or AVIF image.`); continue; }
      if (file.size > MAX_MB * 1024 * 1024) { this.photoErr.set(`“${file.name}” is larger than ${MAX_MB} MB.`); continue; }
      if (this.totalPhotos() + ok.length >= MAX_PHOTOS) { this.photoErr.set(`You can add up to ${MAX_PHOTOS} photos.`); break; }
      ok.push({ file, url: URL.createObjectURL(file) });
    }
    this.newFiles.update(l => [...l, ...ok]);
    input.value = '';
  }

  err(field: string): string {
    const f = this.f;
    switch (field) {
      case 'title': return (f.title || '').trim().length < 3 ? 'Enter a title (at least 3 characters).' : '';
      case 'price': return !(Number(f.price) > 0) ? 'Enter the monthly rent.' : '';
      case 'city': return !f.city ? 'Choose a city.' : '';
      case 'latitude': return f.latitude !== null && f.latitude !== '' && (Number(f.latitude) < -90 || Number(f.latitude) > 90) ? 'Latitude must be between -90 and 90.' : '';
      case 'longitude': return f.longitude !== null && f.longitude !== '' && (Number(f.longitude) < -180 || Number(f.longitude) > 180) ? 'Longitude must be between -180 and 180.' : '';
    }
    return '';
  }

  save() {
    this.tried.set(true); this.serverErr.set('');
    if (this.saving() || ['title', 'price', 'city', 'latitude', 'longitude'].some(k => this.err(k))) return;
    const f = this.f, fd = new FormData();
    const put = (k: string, v: unknown) => fd.append(k, v === null || v === undefined ? '' : String(v));
    put('title', f.title.trim()); put('category', f.category); put('price', f.price); put('city', f.city); put('location', (f.location || '').trim());
    put('beds', f.beds ?? 0); put('baths', f.baths ?? 0); put('area', f.area ?? 0); put('floor', (f.floor || '').trim() || '—');
    put('furnishing', f.furnishing); put('status', f.status); put('description', (f.description || '').trim()); put('featured', !!f.featured);
    put('latitude', f.latitude === '' ? null : f.latitude); put('longitude', f.longitude === '' ? null : f.longitude);
    fd.append('amenities', JSON.stringify(this.amenities()));
    if (this.removed().length) fd.append('removeImages', JSON.stringify(this.removed()));
    for (const n of this.newFiles()) fd.append('images', n.file, n.file.name);

    this.saving.set(true);
    const p = this.property();
    (p ? this.api.updateProperty(p.id, fd) : this.api.addProperty(fd)).subscribe({
      next: r => { this.saving.set(false); this.toast.success(p ? 'Property updated' : 'Property published'); this.newFiles().forEach(n => URL.revokeObjectURL(n.url)); this.saved.emit(r); },
      error: e => { this.saving.set(false); this.serverErr.set(e.message); }
    });
  }
}
