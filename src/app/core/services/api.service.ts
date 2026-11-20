import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { apiBase } from '../config';
import { AppUser, City, Enquiry, Meta, NearbyResult, Paged, Property, SearchFilters, Session } from '../models';

export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}

interface Envelope<T> { Message: string; Status: number; Result: T; Total?: number; Page?: number; PageSize?: number; Pages?: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = apiBase();

  private unwrap<T>(source: Observable<Envelope<T>>): Observable<Envelope<T>> {
    return source.pipe(map(env => {
      if (env.Status !== 200) throw new ApiError(typeof env.Result === 'string' ? env.Result : 'Request failed', env.Status);
      return env;
    }));
  }
  private result<T>(source: Observable<Envelope<T>>): Observable<T> {
    return this.unwrap(source).pipe(map(e => e.Result));
  }
  private params(obj: Record<string, unknown>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'all' && v !== 'any') p = p.set(k, String(v));
    }
    return p;
  }

  // ── auth ──
  login(body: { email: string; password: string; role: string }): Observable<Session> {
    return this.result(this.http.post<Envelope<Session>>(`${this.base}/auth_login/`, body));
  }
  signup(body: Record<string, unknown>): Observable<Session> {
    return this.result(this.http.post<Envelope<Session>>(`${this.base}/auth_signup/`, body));
  }

  // ── meta / cities ──
  meta(): Observable<Meta> { return this.result(this.http.get<Envelope<Meta>>(`${this.base}/meta_get/`)); }
  cities(all = false): Observable<City[]> {
    return this.result(this.http.get<Envelope<City[]>>(`${this.base}/city_get/`, { params: this.params({ all: all ? 1 : '' }) }));
  }
  addCity(body: Partial<City>): Observable<City> { return this.result(this.http.post<Envelope<City>>(`${this.base}/city_create/`, body)); }
  updateCity(id: number, body: Partial<City>): Observable<City> { return this.result(this.http.put<Envelope<City>>(`${this.base}/city_update/${id}`, body)); }
  deleteCity(id: number): Observable<string> { return this.result(this.http.delete<Envelope<string>>(`${this.base}/city_delete/${id}`)); }

  // ── nearby areas / search near me ──
  nearbyAreas(p: { lat?: number | null; lng?: number | null; area?: string; city?: string; radius?: number | null; limit?: number; propLimit?: number }): Observable<NearbyResult> {
    return this.result(this.http.get<Envelope<NearbyResult>>(`${this.base}/nearby_areas/`, { params: this.params({ ...p }) }));
  }

  // ── properties ──
  properties(filters: SearchFilters & Record<string, unknown> = {}, pageSize = 12): Observable<Paged<Property>> {
    const page = Number(filters.page) || 1;
    return this.unwrap(this.http.get<Envelope<Property[]>>(`${this.base}/property_get/`, {
      params: this.params({ ...filters, page, pageSize })
    })).pipe(map(e => ({ items: e.Result, total: e.Total ?? e.Result.length, page: e.Page ?? 1, pages: e.Pages ?? 1, pageSize: e.PageSize ?? pageSize })));
  }
  propertiesByIds(ids: number[]): Observable<Property[]> {
    return this.result(this.http.get<Envelope<Property[]>>(`${this.base}/property_get/`, { params: this.params({ ids: ids.join(',') }) }));
  }
  property(id: number): Observable<Property> {
    return this.result(this.http.get<Envelope<Property[]>>(`${this.base}/property_get/${id}`)).pipe(map(r => r[0]));
  }
  addProperty(form: FormData): Observable<Property> { return this.result(this.http.post<Envelope<Property>>(`${this.base}/property_create/`, form)); }
  updateProperty(id: number, body: FormData | Record<string, unknown>): Observable<Property> {
    return this.result(this.http.put<Envelope<Property>>(`${this.base}/property_update/${id}`, body));
  }
  deleteProperty(id: number): Observable<string> { return this.result(this.http.delete<Envelope<string>>(`${this.base}/property_delete/${id}`)); }

  // ── enquiries ──
  addEnquiry(body: Record<string, unknown>): Observable<Enquiry> { return this.result(this.http.post<Envelope<Enquiry>>(`${this.base}/enquiry_create/`, body)); }
  enquiries(filters: Record<string, unknown> = {}): Observable<Enquiry[]> {
    return this.result(this.http.get<Envelope<Enquiry[]>>(`${this.base}/enquiry_get/`, { params: this.params(filters) }));
  }
  updateEnquiry(id: number, body: Record<string, unknown>): Observable<Enquiry> { return this.result(this.http.put<Envelope<Enquiry>>(`${this.base}/enquiry_update/${id}`, body)); }
  deleteEnquiry(id: number): Observable<string> { return this.result(this.http.delete<Envelope<string>>(`${this.base}/enquiry_delete/${id}`)); }

  // ── users / stats ──
  users(role?: string): Observable<AppUser[]> {
    return this.result(this.http.get<Envelope<AppUser[]>>(`${this.base}/user_get/`, { params: this.params({ role }) }));
  }
  /** The logged-in user deletes their own account (and the enquiries they sent). */
  deleteMyAccount(): Observable<string> { return this.result(this.http.delete<Envelope<string>>(`${this.base}/account_delete/`)); }
  deleteUser(id: number): Observable<string> { return this.result(this.http.delete<Envelope<string>>(`${this.base}/user_delete/${id}`)); }
  stats(): Observable<Record<string, any>> { return this.result(this.http.get<Envelope<Record<string, any>>>(`${this.base}/stats_get/`)); }
}
