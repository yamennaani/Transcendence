import { Component, OnInit, inject, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { DS } from '../tokens';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgStyle, LogoComponent, TranslateModule, RouterLink],
  template: `
    <div [ngStyle]="pageStyle">
      <div [ngStyle]="gridStyle"></div>
      <div [ngStyle]="glowStyle"></div>

      <div style="position:relative;width:100%;max-width:400px">
        <div style="margin-bottom:32px;display:flex;justify-content:center">
          <app-logo [size]="28"/>
        </div>

        <div [ngStyle]="cardStyle">
          @if (verifiedBanner()) {
            <div [ngStyle]="bannerStyle('green')">
              {{ 'login_verified_banner' | translate }}
            </div>
          }
          @if (notInvitedBanner()) {
            <div [ngStyle]="bannerStyle('red')">
              {{ 'login_not_invited_banner' | translate }}
            </div>
          }

          <h1 [ngStyle]="h1Style">{{ 'login_title' | translate }}</h1>
          <p [ngStyle]="subtitleStyle">{{ 'login_subtitle' | translate }}</p>

          <div style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;flex-direction:column;gap:5px">
              <label [ngStyle]="labelStyle">{{ 'label_email' | translate }}</label>
              <input [value]="email()" (input)="email.set($any($event.target).value)"
                     [ngStyle]="inputStyle('email')"
                     (focus)="focused.set('email')" (blur)="focused.set('')"
                     placeholder="you@PeerPilot.school"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px">
              <label [ngStyle]="labelStyle">
                {{ 'label_password' | translate }}
                <span (click)="router.navigate(['/forgot-password'])"
                      [ngStyle]="forgotLinkStyle">{{ 'forgot_password' | translate }}</span>
              </label>
              <input type="password" [value]="password()"
                     (input)="password.set($any($event.target).value)"
                     [ngStyle]="inputStyle('pw')"
                     (focus)="focused.set('pw')" (blur)="focused.set('')"
                     placeholder="••••••••"/>
            </div>
            <!-- Sign in / Sign up — same shape, side by side -->
            <div style="display:flex;gap:8px">
              <button (click)="login()" [ngStyle]="authBtnStyle('signin')"
                      (mouseenter)="authHover.set('signin')" (mouseleave)="authHover.set('')"
                      [disabled]="submitting()">
                {{ (submitting() ? 'btn_signing_in' : 'btn_sign_in') | translate }}
              </button>
              <button (click)="router.navigate(['/register'])" [ngStyle]="authBtnStyle('signup')"
                      (mouseenter)="authHover.set('signup')" (mouseleave)="authHover.set('')">
                {{ 'btn_sign_up' | translate }}
              </button>
            </div>

            <div [ngStyle]="dividerStyle">
              <span [ngStyle]="dividerLineStyle"></span>
              <span [ngStyle]="dividerTextStyle">{{ 'divider_or_continue_with' | translate }}</span>
              <span [ngStyle]="dividerLineStyle"></span>
            </div>

            <!-- GitHub — full width, brand colour -->
            <button (click)="loginWithGitHub()" [ngStyle]="oauthBtnStyle('github')"
                    (mouseenter)="oauthHover.set('github')" (mouseleave)="oauthHover.set('')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {{ 'btn_sign_in_github' | translate }}
            </button>

            <!-- Google — full width, brand colour -->
            <button (click)="loginWithGoogle()" [ngStyle]="oauthBtnStyle('google')"
                    (mouseenter)="oauthHover.set('google')" (mouseleave)="oauthHover.set('')">
              <svg width="20" height="20" viewBox="0 0 24 24" style="flex-shrink:0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {{ 'btn_sign_in_google' | translate }}
            </button>
          </div>

          @if (errorMsg()) {
            <p [ngStyle]="feedbackStyle('error')">{{ errorMsg() }}</p>
          }

        </div>

        <div [ngStyle]="legalLinksStyle">
          <a routerLink="/privacy-policy" [ngStyle]="legalLinkStyle">{{ 'privacy_title' | translate }}</a>
          <span [ngStyle]="legalLinkStyle">·</span>
          <a routerLink="/terms-of-service" [ngStyle]="legalLinkStyle">{{ 'terms_title' | translate }}</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  router   = inject(Router);
  private auth      = inject(AuthService);
  private route     = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  email    = signal('');
  password = signal('');
  focused  = signal('');
  errorMsg = signal('');
  submitting      = signal(false);
  verifiedBanner  = signal(false);
  notInvitedBanner = signal(false);

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    if (params['verified'] === 'true')   this.verifiedBanner.set(true);
    if (params['error']    === 'not_invited') this.notInvitedBanner.set(true);
  }

  login() {
    this.errorMsg.set('');

    if (!this.email() || !this.password()) {
      this.errorMsg.set('Email and password are required.');
      return;
    }

    this.submitting.set(true);
    this.auth.login(this.email(), this.password()).subscribe({
      next: () => {
        this.auth.getMe().subscribe({
          next: (user: any) => {
            this.submitting.set(false);
            const dest = (user?.role === 'Admin' || user?.role === 'Bocal') ? '/bocal' : '/dashboard';
            this.router.navigate([dest]);
          },
          error: () => {
            this.submitting.set(false);
            this.errorMsg.set(this.translate.instant('error_login_user_data_failed'));
          }
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err.error?.error || this.translate.instant('error_login_failed'));
      }
    });
  }

  loginWithGitHub()  { this.auth.loginWithGitHub(); }
  loginWithGoogle()  { window.location.href = '/api/auth/google'; }

  oauthHover = signal('');
  authHover  = signal('');

  authBtnStyle(btn: 'signin' | 'signup') {
    const h = this.authHover() === btn;
    const base = {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flex: '1', padding: '11px 16px', borderRadius: '8px', cursor: 'pointer',
      fontSize: '0.9375rem', fontFamily: DS.fonts.body, fontWeight: '500',
      transition: 'background 150ms, border-color 150ms', outline: 'none',
    };
    if (btn === 'signin') {
      return {
        ...base,
        background: h ? DS.colors.violetDim : DS.colors.violet,
        color: '#fff',
        border: 'none',
      };
    }
    return {
      ...base,
      background: h ? DS.colors.surfaceRaised : DS.colors.surface,
      color: DS.colors.fg1,
      border: `1px solid ${DS.colors.border}`,
    };
  }

  oauthBtnStyle(provider: 'github' | 'google') {
    const h = this.oauthHover() === provider;
    const base = {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      width: '100%', padding: '11px 20px', borderRadius: '8px', cursor: 'pointer',
      fontSize: '0.9375rem', fontFamily: DS.fonts.body, fontWeight: '500',
      transition: 'background 150ms', outline: 'none',
    };
    if (provider === 'github') {
      return { ...base, background: h ? '#2d333b' : '#24292e', color: '#fff', border: '1px solid #444c56' };
    }
    return { ...base, background: h ? '#f1f3f4' : '#ffffff', color: '#3c4043', border: '1px solid #dadce0' };
  }

  readonly dividerStyle = {
    display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0',
  };
  readonly dividerLineStyle = {
    flex: '1', height: '1px', background: DS.colors.border,
  };
  readonly dividerTextStyle = {
    fontSize: '0.75rem', color: DS.colors.fg3, whiteSpace: 'nowrap',
  };

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
    display: 'flex', flexDirection: 'column', gap: '0',
  };
  readonly h1Style = {
    fontFamily: DS.fonts.display, fontSize: '1.375rem', fontWeight: '700',
    color: DS.colors.fg1, marginBottom: '4px', marginTop: '8px',
  };
  readonly subtitleStyle = { fontSize: '0.875rem', color: DS.colors.fg2, marginBottom: '20px' };
  readonly labelStyle = {
    fontSize: '0.8125rem', fontWeight: '500', color: DS.colors.fg2,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  readonly forgotLinkStyle = { color: DS.colors.violet, cursor: 'pointer', fontWeight: '400' };
  readonly legalLinksStyle = {
    display: 'flex', justifyContent: 'center', gap: '8px',
    marginTop: '20px', fontSize: '0.75rem',
  };
  readonly legalLinkStyle = { color: DS.colors.fg3, textDecoration: 'none' };

  bannerStyle(color: 'green' | 'red') {
    const c = color === 'green'
      ? { bg: DS.colors.greenSubtle, border: DS.colors.greenBorder, text: DS.colors.green }
      : { bg: DS.colors.redSubtle,   border: DS.colors.redBorder,   text: DS.colors.red   };
    return {
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: '8px', padding: '10px 14px', fontSize: '0.8125rem',
      marginBottom: '16px',
    };
  }

  feedbackStyle(type: 'error') {
    return { fontSize: '0.75rem', color: DS.colors.red, textAlign: 'center', marginTop: '12px' };
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