import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { Session } from '../models';

const KEY = 'ec.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly session = signal<Session | null>(this.restore());
  readonly user = this.session;
  readonly loggedIn = computed(() => !!this.session());
  readonly isAdmin = computed(() => this.session()?.role === 'admin');
  readonly token = computed(() => this.session()?.token ?? '');

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(KEY);
      const s = raw ? JSON.parse(raw) : null;
      return s?.token ? s : null;
    } catch { return null; }
  }
  private persist(s: Session | null) {
    this.session.set(s);
    try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  }

  login(email: string, password: string, role: string) {
    return this.api.login({ email, password, role }).pipe(tap(s => this.persist(s)));
  }
  signup(body: Record<string, unknown>) {
    return this.api.signup(body).pipe(tap(s => this.persist(s)));
  }
  logout(navigate = true) {
    this.persist(null);
    if (navigate) this.router.navigateByUrl('/');
  }
  /** Called by the interceptor when the API says our token is no longer valid. */
  expire() {
    if (!this.session()) return;
    this.persist(null);
    this.router.navigate(['/login'], { queryParams: { expired: 1 } });
  }
  homeUrl() { return this.isAdmin() ? '/admin' : '/'; }
}
