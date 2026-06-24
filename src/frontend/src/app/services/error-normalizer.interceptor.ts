import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpResponse, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// The backend always returns HTTP 200, using { ok: false, code, error } in the
// body to signal failures. This interceptor converts those responses into proper
// HttpErrorResponse objects so every catchError handler and the AuthInterceptor
// continue to work without any changes.
@Injectable()
export class ErrorNormalizerInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      switchMap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.body?.ok === false) {
          return throwError(() => new HttpErrorResponse({
            error: event.body,
            status: event.body.code || 400,
            statusText: event.body.error || 'Error',
            url: req.url ?? undefined,
          }));
        }
        return of(event);
      }),
    );
  }
}
