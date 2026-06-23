import { Injectable } from "@angular/core";
import { MissingTranslationHandler, MissingTranslationHandlerParams, TranslateService,} from "@ngx-translate/core";

export const SUPPORTED_LANGS = ["en", "de", "hu", "ar"] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

export function isSupportedLang(lang: string | null): lang is SupportedLang {
  return !!lang && (SUPPORTED_LANGS as readonly string[]).includes(lang);
}

// Shared by the language switcher and any route (e.g. the landing page's
// /:lang variants) that needs to change the active language consistently.
export function setLanguage(translate: TranslateService, lang: SupportedLang) {
  translate.use(lang);
  localStorage.setItem("language", lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

@Injectable()
export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (params.translateService.currentLang === "en") {
      return params.key;
    }


    const englishTranslations = params.translateService.translations["en"];
    if (englishTranslations) {
      const englishValue = params.key
        .split(".")
        .reduce(
            (obj: Record<string, unknown> | undefined, segment: string) =>
    obj && typeof obj === "object" ? (obj as Record<string, unknown>)[segment] as Record<string, unknown> | undefined : undefined,
  englishTranslations as Record<string, unknown>
        );

      if (typeof englishValue === "string") {
        return params.translateService.parser.interpolate(
          englishValue,
          params.interpolateParams
        ) ?? englishValue;
      }
    }

    return params.key;
  }
}