import { Component } from '@angular/core';

@Component({
  selector: 'ec-card-skeleton', standalone: true,
  template: `<div class="c"><div class="m skel"></div><div class="b"><div class="skel l1"></div><div class="skel l2"></div><div class="skel l3"></div></div></div>`,
  styles: [`.c{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden}.m{aspect-ratio:4/3.1;border-radius:0}.b{padding:18px 20px 22px;display:grid;gap:11px}.l1{height:26px;width:46%}.l2{height:16px;width:80%}.l3{height:14px;width:60%}`]
})
export class CardSkeleton {}
