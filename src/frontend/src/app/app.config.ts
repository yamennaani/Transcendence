import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth-interceptor';

// ── DEV FLAG ──────────────────────────────────────────────────────────────────
// Set to true  → AuthInterceptor runs (attaches Bearer token to every request)
// Set to false → no interceptor (useful while testing auth without a valid token)
const USE_AUTH_INTERCEPTOR = true;
// ─────────────────────────────────────────────────────────────────────────────

import { TranslateLoader, TranslateModule, TranslateService, MissingTranslationHandler } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MyMissingTranslationHandler } from './languages/language.service';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'languages/', '.json');
}

function initLanguage(translate: TranslateService) {
  return () => {
    const storedLang = localStorage.getItem('language');
    if (storedLang) {
      translate.use(storedLang);
    } 
    else 
    {
      const browserLang = translate.getBrowserLang();
      const defaultLang = browserLang?.match(/en|es/) ? browserLang : 'en';
      translate.use(defaultLang);
      localStorage.setItem('language', defaultLang);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(...(USE_AUTH_INTERCEPTOR ? [withInterceptorsFromDi()] : [])),
    ...(USE_AUTH_INTERCEPTOR ? [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }] : []),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
        missingTranslationHandler: {
          provide: MissingTranslationHandler,
          useClass: MyMissingTranslationHandler,
        },
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initLanguage,
      deps: [TranslateService],
      multi: true,
    },
  ],
};