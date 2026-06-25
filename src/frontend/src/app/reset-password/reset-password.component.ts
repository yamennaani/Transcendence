import { Component, OnInit, inject, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { DS } from '../tokens';
import { LogoComponent } from '../shared/logo.component';
import { BtnComponent } from '../shared/btn.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [NgStyle, LogoComponent, BtnComponent, TranslateModule],
  template: `
    <div [ngStyle]="pageStyle">
      <div [ngStyle]="gridStyle"></div>
      <div [ngStyle]="glowStyle"></div>

      <div style="position:relative;width:100%;max-width:400px">
        <div style="margin-bottom:32px;display:flex;justify-content:center">
          <app-logo [size]="28"/>
        </div>

        <div [ngStyle]="cardStyle">
          @if (!token()) {
            <div [ngStyle]="bannerStyle('red')">
              {{ 'reset_password_invalid_link' | translate }}
            </div>
            <app-btn variant="ghost" size="md" (clicked)="router.navigate(['/forgot-password'])" style="width:100%;margin-top:16px">
              {{ 'btn_request_new_link' | translate }}
            </app-btn>
          } @else if (success()) {
            <div [ngStyle]="bannerStyle('green')">
              {{ 'reset_password_success' | translate }}
            </div>
            <app-btn variant="primary" size="md" (clicked)="router.navigate(['/login'])" style="width:100%;margin-top:16px">
              {{ 'btn_sign_in' | translate }}
            </app-btn>
          } @else {
            <h1 [ngStyle]="h1Style">{{ 'reset_password_set_title' | translate }}</h1>
            <p [ngStyle]="subtitleStyle">{{ 'reset_password_set_subtitle' | translate }}</p>

            <div style="display:flex;flex-direction:column;gap:14px">
              <div style="display:flex;flex-direction:column;gap:5px">
                <label [ngStyle]="labelStyle">{{ 'label_new_password' | translate }}</label>
                <input type="password" [value]="password()"
                       (input)="password.set($any($event.target).value)"
                       [ngStyle]="inputStyle('pw')"
                       (focus)="focused.set('pw')" (blur)="focused.set('')"
                       placeholder="••••••••"/>
              </div>
              <div style="display:flex;flex-direction:column;gap:5px">
                <label [ngStyle]="labelStyle">{{ 'label_confirm_new_password' | translate }}</label>
                <input type="password" [value]="confirmPassword()"
                       (input)="confirmPassword.set($any($event.target).value)"
                       [ngStyle]="inputStyle('confirm')"
                       (focus)="focused.set('confirm')" (blur)="focused.set('')"
                       placeholder="••••••••"/>
              </div>
              <app-btn variant="primary" size="lg" (clicked)="submit()" [disabled]="submitting()" style="width:100%">
                {{ (submitting() ? 'btn_updating' : 'btn_update_password') | translate }}
              </app-btn>
            </div>

            @if (errorMsg()) {
              <p [ngStyle]="errorStyle">{{ errorMsg() }}</p>
            }
            @if (suggestions().length) {
              <ul [ngStyle]="suggestionsStyle">
                @for (s of suggestions(); track s) { <li>{{ s }}</li> }
              </ul>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  router = inject(Router);
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  token           = signal('');
  password        = signal('');
  confirmPassword = signal('');
  focused         = signal('');
  errorMsg        = signal('');
  suggestions     = signal<string[]>([]);
  submitting      = signal(false);
  success         = signal(false);

  ngOnInit() {
    this.token.set(this.route.snapshot.queryParams['token'] ?? '');
  }

  submit() {
    this.errorMsg.set('');
    this.suggestions.set([]);

    if (!this.password()) { this.errorMsg.set(this.translate.instant('error_password_required')); return; }
    if (this.password() !== this.confirmPassword()) {
      this.errorMsg.set(this.translate.instant('error_passwords_mismatch'));
      return;
    }

    this.submitting.set(true);
    this.auth.resetPassword(this.token(), this.password()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        const body = err.error;
        if (err.status === 400 && body?.suggestions?.length) {
          this.errorMsg.set(this.translate.instant('error_password_weak'));
          this.suggestions.set(body.suggestions);
        } else {
          this.errorMsg.set(body?.error || this.translate.instant('error_reset_password_failed'));
        }
      }
    });
  }

  readonly pageStyle = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', background: DS.colors.bg, position: 'relative', overflow: 'hidden',
  };
  readonly gridStyle = {
    position: 'absolute', inset: '0',
    backgroundImage: `linear-gradient(${DS.colors.border} 1px, transparent 1px), linear-gradient(90deg, ${DS.colors.border} 1px, transparent 1px)`,
    backgroundSize: '48px 48px', opacity: '0.25',
  };
  readonly glowStyle = {
    position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
    width: '500px', height: '500px',
    background: 'radial-gradient(circle, oklch(64% 0.28 296 / 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  };
  readonly cardStyle = {
    background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
    borderRadius: '16px', padding: '28px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.6)',
  };
  readonly h1Style         = { fontFamily: DS.fonts.display, fontSize: '1.375rem', fontWeight: '700', color: DS.colors.fg1, marginBottom: '4px' };
  readonly subtitleStyle   = { fontSize: '0.875rem', color: DS.colors.fg2, marginBottom: '20px' };
  readonly labelStyle      = { fontSize: '0.8125rem', fontWeight: '500', color: DS.colors.fg2 };
  readonly errorStyle      = { fontSize: '0.75rem', color: DS.colors.red, textAlign: 'center', marginTop: '12px' };
  readonly suggestionsStyle = {
    fontSize: '0.75rem', color: DS.colors.amber, marginTop: '8px',
    paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px',
  };

  bannerStyle(color: 'green' | 'red') {
    const c = color === 'green'
      ? { bg: DS.colors.greenSubtle, border: DS.colors.greenBorder, text: DS.colors.green }
      : { bg: DS.colors.redSubtle,   border: DS.colors.redBorder,   text: DS.colors.red   };
    return {
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: '8px', padding: '12px 14px', fontSize: '0.875rem',
    };
  }

  inputStyle(id: string) {
    const f = this.focused() === id;
    return {
      background: DS.colors.surface, color: DS.colors.fg1,
      border: `1px solid ${f ? DS.colors.violet : DS.colors.border}`,
      borderRadius: '8px', padding: '10px 14px', fontSize: '0.9375rem',
      fontFamily: DS.fonts.body, outline: 'none',
      boxShadow: f ? '0 0 0 3px oklch(64% 0.28 296 / 0.15)' : 'none',
      transition: 'border-color 150ms, box-shadow 150ms', width: '100%',
    };
  }
}
