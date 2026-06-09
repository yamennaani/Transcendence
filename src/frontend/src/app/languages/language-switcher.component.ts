import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from "@ngx-translate/core";


@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [],
    template: `
    <div class="language-switcher">
      <button class="current-lang">{{ getFlag(currentLanguage) }} {{ currentLanguage }}</button>
      <div class="lang-options">
      @for (lang of languages; track lang.code) {
        <button (click)="switchLanguage(lang.code)">{{ lang.flag }} {{ lang.name }}</button>
      }
      </div>
    </div>`,
    styles: `
      .language-switcher {
        position: relative;
        display: block;
        width: 100%;
      }
      .current-lang {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: white;
        width: 100%;
        text-align: left;
        padding: 0;
      }
      .lang-options {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background-color: white;
        border: 1px solid #ccc;
        z-index: 1;
      }
      .language-switcher:hover .lang-options {
        display: block;
      }
      .lang-options button {
        display: block;
        width: 100%;
        padding: 5px 10px;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
      }
    `
})

/* Language switcher component to toggle between English and Spanish */
export class LanguageSwitcherComponent {
  languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fe', name: 'Français', flag: '🇫🇷' },
	{ code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  ];

  currentLanguage = 'en';

  constructor(private translate: TranslateService) {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      this.currentLanguage = savedLanguage;
    }
  }

  switchLanguage(languageCode: string): void {
    this.currentLanguage = languageCode;
    this.translate.use(languageCode);
    localStorage.setItem('language', languageCode);
  }

  getFlag(languageCode: string): string {
    const language = this.languages.find((lang) => lang.code === languageCode);
    return language ? language.flag : '';
  }
}
