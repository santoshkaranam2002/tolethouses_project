import { Routes } from '@angular/router';
import { adminGuard, customerGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '', loadComponent: () => import('./shared/shell').then(m => m.Shell),
    children: [
      { path: '', pathMatch: 'full', title: 'EstateCraft — Homes for rent in Visakhapatnam', loadComponent: () => import('./pages/home').then(m => m.Home) },
      { path: 'homes', title: 'Search homes — EstateCraft', loadComponent: () => import('./pages/search').then(m => m.Search) },
      { path: 'nearby', title: 'Homes near you — EstateCraft', loadComponent: () => import('./pages/nearby').then(m => m.Nearby) },
      { path: 'homes/:id', title: 'Home details — EstateCraft', loadComponent: () => import('./pages/details').then(m => m.Details) },
      { path: 'saved', title: 'Saved homes — EstateCraft', loadComponent: () => import('./pages/saved').then(m => m.Saved) },
      { path: 'enquiries', title: 'My enquiries — EstateCraft', canActivate: [customerGuard], loadComponent: () => import('./pages/my-enquiries').then(m => m.MyEnquiries) },
    ]
  },
  { path: 'login', title: 'Log in — EstateCraft', canActivate: [guestGuard], loadComponent: () => import('./pages/auth').then(m => m.Auth), data: { mode: 'login' } },
  { path: 'signup', title: 'Create account — EstateCraft', canActivate: [guestGuard], loadComponent: () => import('./pages/auth').then(m => m.Auth), data: { mode: 'signup' } },
  {
    path: 'admin', title: 'Admin — EstateCraft', canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-shell').then(m => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./admin/overview').then(m => m.Overview) },
      { path: 'properties', loadComponent: () => import('./admin/properties').then(m => m.AdminProperties) },
      { path: 'enquiries', loadComponent: () => import('./admin/enquiries').then(m => m.AdminEnquiries) },
      { path: 'customers', loadComponent: () => import('./admin/customers').then(m => m.AdminCustomers) },
      { path: 'locations', loadComponent: () => import('./admin/locations').then(m => m.AdminLocations) },
    ]
  },
  { path: '**', title: 'Not found — EstateCraft', loadComponent: () => import('./pages/not-found').then(m => m.NotFound) }
];
