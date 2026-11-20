import { Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { Icon } from '../core/ui/icon';
import { Logo } from '../shared/logo';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'ec-auth', standalone: true, imports: [FormsModule, RouterLink, Icon, Logo],
  template: `
  <div class="split">
    <aside class="art" aria-hidden="true">
      <a routerLink="/" class="al"><ec-logo [dark]="true" [size]="34"/></a>
      <div class="arches"><i></i><i></i><i></i></div>
      <blockquote><span>“</span>The best homes aren’t found — they’re <em>recognised</em> the moment you walk in.<footer>EstateCraft · Visakhapatnam</footer></blockquote>
    </aside>

    <main class="form">
      <a routerLink="/" class="back"><ec-icon name="chevL" [size]="16"/> Back to homes</a>
      <div class="card">
        <h1 class="display">{{signup() ? 'Create your account' : 'Welcome back'}}</h1>
        <p class="sub">{{signup() ? 'Save homes, send enquiries and track every reply.' : 'Log in to see your saved homes and enquiries.'}}</p>

        @if (expired()) { <div class="note"><ec-icon name="lock" [size]="18"/> Your session expired. Please log in again.</div> }

        <div class="seg" role="radiogroup" aria-label="Account type">
          <button type="button" role="radio" [attr.aria-checked]="role() === 'customer'" [class.on]="role() === 'customer'" (click)="role.set('customer')"><ec-icon name="user" [size]="17"/> Customer</button>
          <button type="button" role="radio" [attr.aria-checked]="role() === 'admin'" [class.on]="role() === 'admin'" (click)="role.set('admin')"><ec-icon name="shield" [size]="17"/> Admin</button>
        </div>

        <form (ngSubmit)="submit()" novalidate>
          @if (signup()) {
            <label class="field"><span>Full name</span><input class="input" [class.invalid]="tried() && name.trim().length < 2" name="name" [(ngModel)]="name" autocomplete="name" placeholder="Your name"/>
              @if (tried() && name.trim().length < 2) { <small class="err">Please enter your name.</small> }</label>
            <label class="field"><span>Phone <em>(optional)</em></span><input class="input" [class.invalid]="tried() && phoneBad()" name="phone" [(ngModel)]="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91 98765 43210"/>
              @if (tried() && phoneBad()) { <small class="err">Enter a valid phone number.</small> }</label>
          }
          <label class="field"><span>Email</span><input class="input" [class.invalid]="tried() && emailBad()" name="email" [(ngModel)]="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"/>
            @if (tried() && emailBad()) { <small class="err">Enter a valid email address.</small> }</label>
          <label class="field"><span>Password</span>
            <span class="pw"><input class="input" [class.invalid]="tried() && pwBad()" name="password" [(ngModel)]="password" [type]="show() ? 'text' : 'password'" [attr.autocomplete]="signup() ? 'new-password' : 'current-password'" placeholder="{{signup() ? 'At least 6 characters' : 'Your password'}}"/>
              <button type="button" class="eye" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Hide password' : 'Show password'"><ec-icon name="eye" [size]="19"/></button></span>
            @if (tried() && pwBad()) { <small class="err">{{signup() ? 'Password must be at least 6 characters.' : 'Enter your password.'}}</small> }</label>
          @if (error()) { <div class="errbox" role="alert"><ec-icon name="alert" [size]="18"/> {{error()}}</div> }
          <button class="btn ember block" type="submit" [disabled]="busy()">@if (busy()) { <span class="spin"></span> {{signup() ? 'Creating account…' : 'Logging in…'}} } @else { {{signup() ? 'Create account' : 'Log in'}} <ec-icon name="arrowR" [size]="18"/> }</button>
        </form>

        <p class="switch">{{signup() ? 'Already have an account?' : 'New to EstateCraft?'}} <a [routerLink]="signup() ? '/login' : '/signup'">{{signup() ? 'Log in' : 'Create an account'}}</a></p>
      </div>
    </main>
  </div>`,
  styles: [`
  :host{display:block}
  .split{display:grid;grid-template-columns:minmax(380px,.9fr) 1.1fr;min-height:100vh}
  .art{background:var(--ink);color:#fff;padding:36px 44px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;border-radius:0 44px 44px 0}
  .al{position:relative;z-index:2;width:fit-content}
  .arches{position:absolute;inset:auto 0 0 0;height:75%;display:flex;align-items:flex-end;justify-content:center;gap:16px;padding:0 40px}
  .arches i{flex:1;border-radius:999px 999px 0 0;background:linear-gradient(180deg,rgba(233,162,59,.9),rgba(226,85,45,.55));animation:sway 7s ease-in-out infinite}
  .arches i:nth-child(1){height:52%;opacity:.7}.arches i:nth-child(2){height:84%;animation-delay:-2s}.arches i:nth-child(3){height:64%;opacity:.55;animation-delay:-4s}
  @keyframes sway{50%{transform:translateY(-14px)}}
  blockquote{position:relative;z-index:2;margin:0;font-family:var(--font-display);font-size:clamp(26px,2.6vw,38px);line-height:1.2;max-width:460px;text-shadow:0 2px 20px rgba(16,26,43,.5)}
  blockquote span{display:block;font-size:90px;line-height:.5;color:var(--gold);margin-bottom:12px}blockquote em{color:var(--gold)}
  blockquote footer{font-family:var(--font-ui);font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-top:22px;opacity:.75}
  .form{display:grid;align-content:center;justify-items:center;padding:32px 24px;position:relative;background:var(--paper)}
  .back{position:absolute;top:28px;left:32px;display:inline-flex;align-items:center;gap:4px;font-weight:600;font-size:14px;padding:8px 14px 8px 8px;border-radius:99px}.back:hover{background:var(--sand)}
  .card{width:min(440px,100%);animation:pagein .8s var(--ease) both}.display{font-size:clamp(34px,4vw,46px)}.sub{color:var(--ink-3);margin:10px 0 24px}
  .seg{display:grid;grid-template-columns:1fr 1fr;background:var(--sand);border-radius:99px;padding:5px;margin-bottom:22px}
  .seg button{display:inline-flex;gap:8px;align-items:center;justify-content:center;padding:11px;border-radius:99px;font-weight:600;color:var(--ink-3);transition:all .35s var(--ease)}.seg button.on{background:#fff;color:var(--ink);box-shadow:var(--shadow-sm)}
  form{display:grid;gap:16px}.field em{font-style:normal;font-weight:400;color:var(--mute)}
  .pw{position:relative;display:block}.pw .input{padding-right:52px}.eye{position:absolute;right:6px;top:50%;margin-top:-20px;width:40px;height:40px;display:grid;place-items:center;border-radius:50%;color:var(--ink-3)}.eye:hover{background:var(--sand)}
  .errbox,.note{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;font-size:14px;line-height:1.4}.errbox{background:#fdeae6;color:#8f2415}.note{background:var(--gold-soft);color:#7a5010;margin-bottom:18px}
  .switch{text-align:center;margin-top:22px;color:var(--ink-3)}.switch a{color:var(--ember);font-weight:700}.switch a:hover{text-decoration:underline}
  @media(max-width:860px){.split{grid-template-columns:1fr}.art{min-height:0;height:190px;padding:22px 24px;border-radius:0 0 32px 32px}.arches,blockquote{display:none}.back{position:static;justify-self:start;margin-bottom:12px}.form{padding-top:22px;align-content:start}}
  `]
})
export class Auth {
  mode = input<'login' | 'signup'>('login');
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  signup = computed(() => (this.route.snapshot.data['mode'] ?? this.mode()) === 'signup');

  role = signal<'customer' | 'admin'>(this.route.snapshot.queryParamMap.get('role') === 'admin' ? 'admin' : 'customer');
  expired = signal(this.route.snapshot.queryParamMap.has('expired'));
  busy = signal(false);
  error = signal('');
  tried = signal(false);
  show = signal(false);
  name = ''; phone = ''; email = ''; password = '';

  emailBad = () => !EMAIL.test(this.email.trim());
  pwBad = () => this.signup() ? this.password.length < 6 : this.password.length < 1;
  phoneBad = () => !!this.phone.trim() && !/^[0-9+()\-\s]{7,20}$/.test(this.phone.trim());

  submit() {
    this.tried.set(true); this.error.set('');
    if (this.busy() || this.emailBad() || this.pwBad() || (this.signup() && (this.name.trim().length < 2 || this.phoneBad()))) return;
    this.busy.set(true);
    const email = this.email.trim().toLowerCase();
    const req = this.signup()
      ? this.auth.signup({ name: this.name.trim(), phone: this.phone.trim(), email, password: this.password, role: this.role() })
      : this.auth.login(email, this.password, this.role());
    req.subscribe({
      next: s => {
        this.busy.set(false);
        this.toast.success(this.signup() ? `Welcome to EstateCraft, ${s.name.split(' ')[0]}!` : `Welcome back, ${s.name.split(' ')[0]}`);
        const next = this.route.snapshot.queryParamMap.get('next');
        this.router.navigateByUrl(s.role === 'admin' ? '/admin' : (next && next.startsWith('/') ? next : '/'));
      },
      error: e => { this.busy.set(false); this.error.set(e.message); }
    });
  }
}
