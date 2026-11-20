import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { MetaService } from '../core/services/meta.service';
import { ToastService } from '../core/services/toast.service';
import { ConfirmService } from '../core/ui/confirm';
import { City } from '../core/models';
import { Icon } from '../core/ui/icon';
import { ADMIN_CSS } from './admin-css';

@Component({
  selector: 'ec-admin-locations', standalone: true, imports: [FormsModule, Icon],
  template: `
  <div class="ph"><div><h1>Locations</h1><p>Cities and localities customers can search. Add a city here and it appears across the whole site — no code changes.</p></div>
    <button class="btn ember" (click)="openForm(null)"><ec-icon name="plus" [size]="18"/> Add city</button></div>
  @if (error()) { <div class="errbar"><ec-icon name="alert" [size]="18"/> {{error()}} <button (click)="load()">Retry</button></div> }
  @if (!cities() && !error()) { <div class="grid">@for (i of [1,2]; track i) { <div class="skel big"></div> }</div> }
  @else if (cities()) {
    <div class="grid">
      @for (c of cities()!; track c.id; let i = $index) {
        <article class="city" [class.off]="!c.active" [style.--i]="i">
          <div class="ct"><div><h3>{{c.name}}</h3><small>{{c.state || '—'}}@if (c.tagline) { · {{c.tagline}} }</small></div><span class="st" [class.ok]="c.active">{{c.active ? 'Live' : 'Hidden'}}</span></div>
          <p class="cnt"><b>{{c.propertyCount}}</b> live {{c.propertyCount === 1 ? 'listing' : 'listings'}} · <b>{{c.areas.length}}</b> localities</p>
          <div class="areas">@for (a of c.areas; track a) { <span class="chip">{{a}}</span> } @empty { <small class="muted">No localities yet</small> }</div>
          <div class="ca"><button class="btn ghost sm" (click)="openForm(c)"><ec-icon name="edit" [size]="16"/> Edit</button>
            <button class="btn ghost sm" (click)="toggle(c)">{{c.active ? 'Hide' : 'Show'}}</button>
            <button class="ibtn del" (click)="remove(c)" aria-label="Delete city"><ec-icon name="trash" [size]="18"/></button></div>
        </article>
      }
    </div>
  }

  @if (editing() !== undefined) {
    <div class="scrim" (click)="editing.set(undefined)"></div>
    <div class="dlg" role="dialog" aria-modal="true">
      <h2>{{editing() ? 'Edit city' : 'Add a city'}}</h2>
      <form (ngSubmit)="save()" novalidate>
        <label class="field"><span>City name *</span><input class="input" [class.invalid]="tried && name.trim().length < 2" name="name" [(ngModel)]="name" placeholder="e.g. Hyderabad"/>@if (tried && name.trim().length < 2) { <small class="err">Enter the city name.</small> }</label>
        <label class="field"><span>State</span><input class="input" name="state" [(ngModel)]="state" placeholder="e.g. Telangana"/></label>
        <label class="field"><span>Tagline <em>(optional)</em></span><input class="input" name="tagline" [(ngModel)]="tagline" placeholder="e.g. The City of Pearls"/></label>
        <label class="field"><span>Localities <em>(one per line or comma-separated)</em></span><textarea class="textarea" name="areas" [(ngModel)]="areasText" rows="5" placeholder="Gachibowli&#10;Madhapur&#10;Banjara Hills"></textarea></label>
        <label class="check"><input type="checkbox" name="active" [(ngModel)]="active"/><span>Show this city to customers</span></label>
        @if (formErr()) { <p class="errbox"><ec-icon name="alert" [size]="18"/> {{formErr()}}</p> }
        <div class="fb"><button type="button" class="btn ghost" (click)="editing.set(undefined)">Cancel</button><button class="btn ember" type="submit" [disabled]="saving()">@if (saving()) { <span class="spin"></span> Saving… } @else { Save city }</button></div>
      </form>
    </div>
  }`,
  styles: [ADMIN_CSS + `.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px}.big{height:240px;border-radius:var(--r-lg)}
  .city{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:24px;display:grid;gap:14px;transition:all .4s var(--ease);animation:pagein .6s var(--ease) both;animation-delay:calc(var(--i)*70ms)}.city:hover{box-shadow:var(--shadow);transform:translateY(-3px)}.city.off{opacity:.65}
  .ct{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ct h3{font-size:30px}.ct small{color:var(--ink-3)}.cnt{color:var(--ink-3)}.cnt b{color:var(--ink)}
  .areas{display:flex;flex-wrap:wrap;gap:6px}.ca{display:flex;gap:8px;align-items:center;border-top:1px dashed var(--line);padding-top:14px}.ca .ibtn{margin-left:auto}
  .scrim{position:fixed;inset:0;background:rgba(16,26,43,.5);z-index:300;backdrop-filter:blur(3px)}.dlg{position:fixed;z-index:310;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 28px));max-height:92vh;overflow:auto;background:#fff;border-radius:28px;padding:28px;box-shadow:var(--shadow-lg);animation:p .4s var(--ease)}@keyframes p{from{opacity:0;transform:translate(-50%,-46%) scale(.96)}}
  .dlg h2{font-size:30px;margin-bottom:18px}form{display:grid;gap:14px}em{font-style:normal;font-weight:400;color:var(--mute)}.check{display:flex;gap:10px;align-items:center;font-weight:600}.check input{width:20px;height:20px;accent-color:var(--ember)}
  .errbox{display:flex;gap:10px;background:#fdeae6;color:#8f2415;border-radius:14px;padding:12px 14px;margin:0}.fb{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}`]
})
export class AdminLocations implements OnInit {
  private api = inject(ApiService);
  private meta = inject(MetaService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  cities = signal<City[] | null>(null);
  error = signal('');
  editing = signal<City | null | undefined>(undefined);
  saving = signal(false); formErr = signal('');
  tried = false;
  name = ''; state = ''; tagline = ''; areasText = ''; active = true;

  ngOnInit() { this.load(); }
  load() { this.error.set(''); this.api.cities(true).subscribe({ next: r => this.cities.set(r), error: e => this.error.set(e.message) }); }

  openForm(c: City | null) {
    this.tried = false; this.formErr.set('');
    this.name = c?.name ?? ''; this.state = c?.state ?? ''; this.tagline = c?.tagline ?? ''; this.areasText = (c?.areas ?? []).join('\n'); this.active = c?.active ?? true;
    this.editing.set(c);
  }
  save() {
    this.tried = true; this.formErr.set('');
    if (this.saving() || this.name.trim().length < 2) return;
    const body = { name: this.name.trim(), state: this.state.trim(), tagline: this.tagline.trim(), active: this.active, areas: this.areasText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) };
    const c = this.editing();
    this.saving.set(true);
    (c ? this.api.updateCity(c.id, body) : this.api.addCity(body)).subscribe({
      next: () => { this.saving.set(false); this.editing.set(undefined); this.toast.success(c ? 'City updated' : 'City added — it’s now searchable'); this.load(); this.meta.load(true); },
      error: e => { this.saving.set(false); this.formErr.set(e.message); }
    });
  }
  toggle(c: City) {
    this.api.updateCity(c.id, { active: !c.active }).subscribe({
      next: () => { this.toast.success(c.active ? 'City hidden from customers' : 'City is live'); this.load(); this.meta.load(true); },
      error: e => this.toast.error(e.message)
    });
  }
  async remove(c: City) {
    if (!await this.confirm.open(`Delete ${c.name}?`, 'This only works for cities with no listings. Otherwise hide it instead.', 'Delete city', true)) return;
    this.api.deleteCity(c.id).subscribe({
      next: () => { this.toast.success('City deleted'); this.load(); this.meta.load(true); },
      error: e => this.toast.error(e.message)
    });
  }
}
