import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from './services/api.service';
import { AuthService } from './services/auth.service';

/** Adds the bearer token and turns every transport/HTTP failure into a readable ApiError. */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(catchError((err: HttpErrorResponse) => {
    if (err.status === 401 && token) auth.expire();
    let message = 'Something went wrong. Please try again.';
    if (err.status === 0) message = 'Can’t reach the server. Check your connection and try again.';
    else if (typeof err.error?.Result === 'string') message = err.error.Result;
    else if (err.status === 413) message = 'The upload is too large.';
    else if (err.status >= 500) message = 'The server had a problem. Please try again in a moment.';
    return throwError(() => new ApiError(message, err.status));
  }));
};
