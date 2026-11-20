import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { ConfirmService } from '../core/ui/confirm';
import { Enquiry } from '../core/models';
import { Icon } from '../core/ui/icon';
import { Img } from '../core/ui/img';

const FLOW = ['New', 'Contacted', 'Interested', 'Visit Scheduled', 'Completed'];

@Component({
  selector: 'ec-my-enquiries', standalone: true, imports: [RouterLink, Icon, Img],
  template: `
  <section class="top"><div class="wrap"><span class="eyebrow">Your conversations</span><h1 class="display">My enquiries</h1>
    <p class="muted">Every enquiry you’ve sent, and where it stands.</p></div></section>
  <div class="wrap body">
    @if (loading()) { <div class="list">@for (i of [1,2,3]; track i) { <div class="skel sk"></div> }</div> }
    @else if (error()) { <div class="state"><ec-icon name="alert" [size]="34"/><h3>Couldn’t load your enquiries</h3><p>{{error()}}</p><button class="btn" (click)="load()">Try again</button></div> }
    @else if (!items().length) { <div class="state"><ec-icon name="inbox" [size]="38"/><h3>No enquiries yet</h3><p>Found a home you like? Hit “Contact owner” on its page and it will show up here.</p><a routerLink="/homes" class="btn ember">Find a home</a></div> }
    @else {
      <div class="list">
        @for (e of items(); track e.id; let i = $index) {
          <article class="en" [style.--i]="i">
            <a class="ph" [routerLink]="['/homes', e.propertyId]"><ec-img [src]="e.propertyImage" [seed]="e.propertyId" label="Home" [alt]="e.propertyTitle"/></a>
            <div class="mid">
              <div class="row1"><a [routerLink]="['/homes', e.propertyId]"><h3>{{e.propertyTitle}}</h3></a><span class="st s-{{cls(e.status)}}">{{e.status}}</span></div>
              <p class="meta"><ec-icon name="calendar" [size]="14"/> Sent {{e.date}} @if (e.propertyCity) { · <ec-icon name="pin" [size]="14"/> {{e.propertyCity}} }</p>
              <p class="msg">“{{e.message || 'No message'}}”</p>
              @if (e.status !== 'Closed') {
                <ol class="track" aria-label="Enquiry progress">@for (s of flow; track s; let k = $index) { <li [class.done]="k <= idx(e.status)" [class.cur]="k === idx(e.status)"><i></i><span>{{s}}</span></li> }</ol>
              } @else { <p class="closed">This enquiry has been closed.</p> }
              <div class="act"><button class="del" (click)="remove(e)" [disabled]="busyId() === e.id" aria-label="Delete this enquiry"><ec-icon name="trash" [size]="16"/> Delete enquiry</button></div>
            </div>
          </article>
        }
      </div>
    }
  </div>`,
  styles: [`.top{padding:48px 0 30px;background:linear-gradient(180deg,var(--sand),var(--paper))}.top .eyebrow{margin-bottom:14px}.top p{margin-top:12px}
  .body{padding-top:20px;max-width:960px}.list{display:grid;gap:18px}.sk{height:170px;border-radius:var(--r-lg)}
  .en{display:grid;grid-template-columns:230px 1fr;gap:24px;background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:14px;animation:cin .7s var(--ease) both;animation-delay:calc(var(--i)*70ms);transition:box-shadow .4s,transform .4s var(--ease)}
  .en:hover{box-shadow:var(--shadow);transform:translateY(-3px)}@keyframes cin{from{opacity:0;transform:translateY(22px)}}
  .ph{display:block;border-radius:18px;overflow:hidden;aspect-ratio:4/3}.ph ec-img{height:100%}.ph:hover ec-img{transform:scale(1.06)}.ph ec-img{transition:transform .8s var(--ease)}
  .mid{padding:8px 10px 8px 0;display:grid;gap:8px;align-content:start;min-width:0}
  .row1{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}h3{font-family:var(--font-ui);font-size:19px;font-weight:600;letter-spacing:0}.row1 a:hover h3{color:var(--ember)}
  .st{font-size:12.5px;font-weight:700;padding:5px 12px;border-radius:99px;white-space:nowrap;background:var(--sand);color:var(--ink-2)}
  .s-new{background:#e1ecf8;color:#1d4f86}.s-contacted{background:#fdf0d5;color:#8a5a10}.s-interested{background:#e0f3e8;color:#1c6b45}.s-visit{background:#efe3fa;color:#5d33a0}.s-completed{background:#d8f1e2;color:#1c6b45}.s-closed{background:#eceef2;color:#5b6678}
  .meta{display:flex;align-items:center;gap:5px;color:var(--ink-3);font-size:13.5px}.msg{color:var(--ink-2);font-style:italic;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .track{list-style:none;margin:8px 0 0;padding:0;display:flex;gap:0}.track li{flex:1;display:grid;gap:6px;font-size:11.5px;color:var(--mute);font-weight:600;position:relative}
  .track i{height:6px;background:var(--line);border-radius:9px;margin-right:4px;transition:background .5s}.track li.done i{background:var(--gold)}.track li.cur i{background:var(--ember)}.track li.cur{color:var(--ink)}
  .closed{color:var(--mute);font-size:14px}
  .act{display:flex;justify-content:flex-end}.del{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600;color:var(--ink-3);padding:7px 12px;border-radius:99px;transition:all .25s}.del:hover{background:#fde2dc;color:var(--bad)}.del[disabled]{opacity:.5;pointer-events:none}
  .state{background:var(--sand);border-radius:var(--r-lg);padding:70px 20px;display:grid;justify-items:center;gap:10px;text-align:center;color:var(--ink-3)}.state h3{color:var(--ink);font-family:var(--font-display);font-size:28px}.state ec-icon{color:var(--ember)}.state .btn{margin-top:10px}.state p{max-width:420px}
  @media(max-width:700px){.en{grid-template-columns:1fr;gap:12px}.mid{padding:0 6px 8px}.track li span{display:none}.track li.cur span{display:block;position:absolute;top:12px;white-space:nowrap}.track{margin-bottom:18px}}`]
})
export class MyEnquiries implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  busyId = signal(0);
  items = signal<Enquiry[]>([]);
  loading = signal(true);
  error = signal('');
  flow = FLOW;
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set('');
    this.api.enquiries().subscribe({ next: r => { this.items.set(r); this.loading.set(false); }, error: e => { this.error.set(e.message); this.loading.set(false); } });
  }
  async remove(e: Enquiry) {
    if (!await this.confirm.open('Delete this enquiry?', `Your enquiry about “${e.propertyTitle}” will be removed permanently.`, 'Delete', true)) return;
    this.busyId.set(e.id);
    this.api.deleteEnquiry(e.id).subscribe({
      next: () => { this.busyId.set(0); this.items.update(l => l.filter(x => x.id !== e.id)); this.toast.success('Enquiry deleted'); },
      error: er => { this.busyId.set(0); this.toast.error(er.message); }
    });
  }
  idx(s: string) { return FLOW.indexOf(s); }
  cls(s: string) { return s.split(' ')[0].toLowerCase(); }
}
