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
 
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
  MissingTranslationHandler,
} from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { MyMissingTranslationHandler } from "./languages/language.service";
 
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "languages/", ".json");
}
 
function initLanguage(translate: TranslateService) {
  return (): Promise<void> => {
    translate.setDefaultLang("en");
 
    const storedLang = localStorage.getItem("language");
    const targetLang = storedLang
      ? storedLang
      : (translate.getBrowserLang()?.match(/en|de|hu|ar/)
          ? translate.getBrowserLang()!
          : "en");
 
    if (!storedLang) {
      localStorage.setItem("language", targetLang);
    }
 
    // Set RTL direction immediately if the stored language needs it.
    document.documentElement.dir = targetLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = targetLang;

    if (targetLang === "en") {
      return translate.use("en").toPromise().then(() => undefined);
    }
 
    return translate
      .use("en")
      .toPromise()
      .then(() => translate.use(targetLang).toPromise())
      .then(() => undefined);
  };
}
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      ...(USE_AUTH_INTERCEPTOR ? [withInterceptorsFromDi()] : [])
    ),
    ...(USE_AUTH_INTERCEPTOR
      ? [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
          },
        ]
      : []),
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
        useDefaultLang: false,
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