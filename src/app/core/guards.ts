import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (_r, state) => {
  const auth = inject(AuthService);
  return auth.loggedIn() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { next: state.url } });
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  if (!auth.loggedIn()) return router.createUrlTree(['/login'], { queryParams: { role: 'admin' } });
  return auth.isAdmin() ? true : router.createUrlTree(['/']);
};

/** Admins live in the console; keep them out of the customer-only pages. */
export const customerGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  if (!auth.loggedIn()) return router.createUrlTree(['/login']);
  return auth.isAdmin() ? router.createUrlTree(['/admin']) : true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.loggedIn() ? inject(Router).parseUrl(auth.homeUrl()) : true;
};
