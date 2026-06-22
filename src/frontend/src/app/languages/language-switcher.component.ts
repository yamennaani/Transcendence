import { Component, HostListener } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="language-switcher">
      <span class="lang-label">{{ 'label_language' | translate }}</span>
      <button
        class="current-lang"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isOpen"
        aria-haspopup="listbox"
      >
        {{ getFlag(currentLanguage) }}&nbsp;{{ getCurrentName() }}
        <span class="chevron">▲</span>
      </button>

      <div class="lang-options" [class.show]="isOpen" role="listbox">
        @for (lang of languages; track lang.code) {
          <button
            class="lang-option"
            role="option"
            [attr.aria-selected]="lang.code === currentLanguage"
            [class.active]="lang.code === currentLanguage"
            (click)="selectLanguage(lang.code)">
            {{ lang.flag }}&nbsp;{{ lang.name }}
          </button>
        }
      </div>
    </div>`,
  styles: `
    .language-switcher {
      position: relative;
      display: block;
      width: 100%;
    }
    .lang-label {
      display: block;
      font-size: 0.625rem;
      color: oklch(48% 0.01 272);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
    }
    .current-lang {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      color: oklch(84% 0.01 272);
      width: 100%;
      text-align: left;
      padding: 0;
      font-family: inherit;
    }
    .chevron {
      margin-left: auto;
      font-size: 0.5rem;
      color: oklch(48% 0.01 272);
      transition: transform 200ms;
    }
    /* rotate chevron when open */
    .language-switcher:has(.lang-options.show) .chevron {
      transform: rotate(180deg);
    }
    .lang-options {
      /* hidden by default, no display:none so we can transition */
      position: absolute;
      bottom: calc(100% + 6px);
      left: 0;
      right: 0;
      background: oklch(16% 0.02 272);
      border: 1px solid oklch(26% 0.02 272);
      border-radius: 8px;
      overflow: hidden;
      z-index: 200;
      box-shadow: 0 -8px 24px oklch(0% 0 0 / 40%);
      
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(4px);
      transition: opacity 150ms, visibility 0s 150ms, transform 150ms;
    }
    .lang-options.show {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
      transition: opacity 150ms, visibility 0s 0s, transform 150ms;
    }
    .lang-option {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 9px 12px;
      background: none;
      border: none;
      color: oklch(72% 0.01 272);
      font-size: 0.875rem;
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      transition: background 120ms, color 120ms;
    }
    .lang-option:hover {
      background: oklch(22% 0.02 272);
      color: oklch(94% 0.005 272);
    }
    .lang-option.active {
      color: oklch(72% 0.28 296);
      background: oklch(20% 0.04 296);
    }
  `
})
export class LanguageSwitcherComponent {
  languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  currentLanguage = 'en';
  isOpen = false;

  constructor(private translate: TranslateService) {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      this.currentLanguage = savedLanguage;
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(languageCode: string): void {
    if (this.currentLanguage === languageCode) {
      this.isOpen = false;  // close even if same language
      return;
    }
    this.switchLanguage(languageCode);
    this.isOpen = false;
  }

  switchLanguage(languageCode: string): void {
    this.currentLanguage = languageCode;
    this.translate.use(languageCode);
    localStorage.setItem('language', languageCode);
    document.documentElement.dir = languageCode === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
  }

  getFlag(languageCode: string): string {
    return this.languages.find(l => l.code === languageCode)?.flag ?? '';
  }

  getCurrentName(): string {
    return this.languages.find(l => l.code === this.currentLanguage)?.name ?? this.currentLanguage;
  }

  // Close when clicking outside
  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null): void {
    const clickedInside = (target as HTMLElement)?.closest('.language-switcher');
    if (!clickedInside) {
      this.isOpen = false;
    }
  }
}