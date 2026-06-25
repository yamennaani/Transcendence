import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    let authReq = req;
    if (token) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/refresh') && !req.url.includes('/login') && !req.url.includes('/logout')) {
          if (!this.auth.getToken()) return EMPTY;
          return this.handle401(authReq, next);
        }
        return throwError(() => err);
      })
    );
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);
      // catchError sits directly on the refresh call so it only fires when the refresh token
      // itself is invalid/expired — not when a successfully-retried request 401s again for an
      // unrelated, non-auth reason (e.g. a business-logic 401 from the endpoint itself).
      return this.auth.refreshToken().pipe(
        catchError((_err: any) => {
          this.isRefreshing = false;
          this.auth.clearToken();
          window.location.href = '/login';
          return EMPTY;
        }),
        switchMap((res: any) => {
          this.isRefreshing = false;
          this.auth.setToken(res.accessToken);
          this.refreshSubject.next(res.accessToken);
          return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } }));
        })
      );
    } else {
      return this.refreshSubject.pipe(
        filter((token: string | null) => token !== null),
        take(1),
        switchMap((token: string | null) => next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
      );
    }
  }
}