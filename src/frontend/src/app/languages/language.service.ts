import { Injectable } from "@angular/core";
import { MissingTranslationHandler, MissingTranslationHandlerParams, TranslateService,} from "@ngx-translate/core";

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