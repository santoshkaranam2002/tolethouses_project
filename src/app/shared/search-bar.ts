import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../core/services/meta.service';
import { Icon, CATEGORY_ICON } from '../core/ui/icon';
import { BUDGETS } from '../core/filters';

/** The big hero search. Cities, areas and categories all come from the API. */
@Component({
  selector: 'ec-search-bar', standalone: true, imports: [FormsModule, RouterLink, Icon],
  template: `
  <form class="sb" (ngSubmit)="go()">
    <div class="tabs" role="tablist" aria-label="Property type">
      <button type="button" role="tab" [class.on]="cat() === ''" (click)="cat.set('')">All</button>
      @for (c of meta.categories(); track c.key) {
        <button type="button" role="tab" [class.on]="cat() === c.key" (click)="cat.set(c.key)"><ec-icon [name]="icons[c.key]" [size]="16"/><span>{{c.short}}</span></button>
      }
      <a class="near" routerLink="/nearby" [queryParams]="{near: 1}"><ec-icon name="locate" [size]="16"/><span>Near me</span></a>
    </div>
    <div class="row">
      <label class="f"><span><ec-icon name="pin" [size]="15"/> City</span>
        <select class="sel" name="city" [ngModel]="city()" (ngModelChange)="city.set($event); area.set('')">
          <option value="">All cities</option>
          @for (c of meta.cities(); track c.id) { <option [value]="c.name">{{c.name}}</option> }
        </select></label>
      <label class="f"><span><ec-icon name="compass" [size]="15"/> Locality</span>
        <select class="sel" name="area" [ngModel]="area()" (ngModelChange)="area.set($event)" [disabled]="!areas().length">
          <option value="">{{areas().length ? 'Any locality' : 'Pick a city first'}}</option>
          @for (a of areas(); track a) { <option [value]="a">{{a}}</option> }
        </select></label>
      <label class="f"><span><ec-icon name="layers" [size]="15"/> Monthly budget</span>
        <select class="sel" name="budget" [ngModel]="budget()" (ngModelChange)="budget.set($event)">
          @for (b of budgets; track b.id) { <option [value]="b.id">{{b.label}}</option> }
        </select></label>
      <button class="btn ember go" type="submit"><ec-icon name="search" [size]="20"/> <span>Search homes</span></button>
    </div>
  </form>`,
  styles: [`
  .sb{background:#fff;border-radius:28px;padding:10px;box-shadow:var(--shadow-lg);border:1px solid var(--line)}
  .tabs{display:flex;gap:4px;padding:6px 6px 10px;overflow-x:auto;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}
  .tabs button{display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:999px;font-weight:600;font-size:14px;color:var(--ink-3);white-space:nowrap;transition:all .3s var(--ease)}
  .tabs button:hover{background:var(--sand);color:var(--ink)}
  .tabs button.on{background:var(--ink);color:#fff}
  .near{margin-left:auto;display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;font-weight:700;font-size:14px;white-space:nowrap;color:var(--ember);box-shadow:inset 0 0 0 1.5px var(--ember);transition:all .3s var(--ease)}
  .near:hover{background:var(--ember);color:#fff;transform:translateY(-1px)}
  .row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;align-items:stretch}
  .f{display:grid;gap:2px;padding:10px 16px 8px;border-radius:18px;background:var(--sand);transition:background .25s,box-shadow .25s;cursor:pointer;min-width:0}
  .f:hover{background:var(--sand-2)}.f:focus-within{background:#fff;box-shadow:inset 0 0 0 2px var(--ember)}
  .f span{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
  .sel{appearance:none;border:0;background:transparent;font-weight:600;font-size:16px;padding:4px 0;outline:none;cursor:pointer;width:100%;text-overflow:ellipsis;color:var(--ink)}
  .sel:disabled{color:var(--mute);cursor:not-allowed}
  .go{border-radius:18px;min-height:64px;padding:0 30px;font-size:16px}
  @media(max-width:900px){.row{grid-template-columns:1fr 1fr}.go{grid-column:1/-1;min-height:54px}}
  @media(max-width:520px){.row{grid-template-columns:1fr}.sb{border-radius:24px}}
  `]
})
export class SearchBar {
  meta = inject(MetaService);
  private router = inject(Router);
  icons = CATEGORY_ICON;
  budgets = BUDGETS;
  cat = signal('');
  city = signal('');
  area = signal('');
  budget = signal('');
  areas = computed(() => this.city() ? this.meta.areasOf(this.city()) : []);

  constructor() {
    // With a single live city (Vizag today) pre-select it so its localities are one click away.
    effect(() => { const c = this.meta.cities(); if (c.length === 1 && !this.city()) this.city.set(c[0].name); });
  }

  go() {
    const b = BUDGETS.find(x => x.id === this.budget());
    this.router.navigate(['/homes'], { queryParams: {
      category: this.cat() || null, city: this.city() || null, area: this.area() || null,
      minPrice: b?.min || null, maxPrice: b?.max || null
    } });
  }
}
