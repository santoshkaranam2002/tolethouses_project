import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fades/slides an element in the first time it scrolls into view. Optional [revealDelay] in ms. */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  revealDelay = input(0);
  private io?: IntersectionObserver;

  ngOnInit() {
    const el = this.el;
    el.classList.add('reveal');
    if (this.revealDelay()) el.style.setProperty('--d', this.revealDelay() + 'ms');
    if (reduced() || typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return; }
    this.io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { el.classList.add('in'); this.io?.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    this.io.observe(el);
  }
  ngOnDestroy() { this.io?.disconnect(); }
}

/** Counts up to [appCount] when it becomes visible. */
@Directive({ selector: '[appCount]', standalone: true })
export class CountDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  appCount = input.required<number>();
  private io?: IntersectionObserver;
  private raf = 0;

  ngOnInit() {
    const target = Math.max(0, Number(this.appCount()) || 0);
    if (reduced() || typeof IntersectionObserver === 'undefined') { this.el.textContent = String(target); return; }
    this.el.textContent = '0';
    this.io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      this.io?.disconnect();
      const t0 = performance.now(), dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        this.el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    this.io.observe(this.el);
  }
  ngOnDestroy() { this.io?.disconnect(); cancelAnimationFrame(this.raf); }
}

/** Subtle 3D tilt that follows the pointer (fine pointers only). */
@Directive({
  selector: '[appTilt]', standalone: true,
  host: { '(pointermove)': 'move($event)', '(pointerleave)': 'reset()' }
})
export class TiltDirective {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private fine = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced();
  move(e: PointerEvent) {
    if (!this.fine) return;
    const r = this.el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    this.el.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg');
    this.el.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
    this.el.style.setProperty('--mx', (x * 100 + 50).toFixed(1) + '%');
    this.el.style.setProperty('--my', (y * 100 + 50).toFixed(1) + '%');
  }
  reset() {
    this.el.style.setProperty('--ry', '0deg');
    this.el.style.setProperty('--rx', '0deg');
  }
}

/** Moves the element at a fraction of the scroll speed. [appParallax]="0.15" */
@Directive({ selector: '[appParallax]', standalone: true })
export class ParallaxDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  appParallax = input(0.15);
  private raf = 0;
  private on = () => {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      const y = window.scrollY;
      if (y < 1400) this.el.style.setProperty('--py', (y * this.appParallax()).toFixed(1) + 'px');
    });
  };
  ngOnInit() { if (!reduced()) window.addEventListener('scroll', this.on, { passive: true }); }
  ngOnDestroy() { window.removeEventListener('scroll', this.on); cancelAnimationFrame(this.raf); }
}
