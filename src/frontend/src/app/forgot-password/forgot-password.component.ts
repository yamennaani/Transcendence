import { Component, inject, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DS } from '../tokens';
import { LogoComponent } from '../shared/logo.component';
import { BtnComponent } from '../shared/btn.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [NgStyle, LogoComponent, BtnComponent],
  template: `
    <div [ngStyle]="pageStyle">
      <div [ngStyle]="gridStyle"></div>
      <div [ngStyle]="glowStyle"></div>

      <div style="position:relative;width:100%;max-width:400px">
        <div style="margin-bottom:32px;display:flex;justify-content:center">
          <app-logo [size]="28"/>
        </div>

        <div [ngStyle]="cardStyle">
          @if (sent()) {
            <div [ngStyle]="bannerStyle">
              If an account with that email exists, a reset link has been sent. Check your inbox.
            </div>
            <app-btn variant="ghost" size="md" (clicked)="router.navigate(['/login'])" style="width:100%;margin-top:16px">
              Back to sign in
            </app-btn>
          } @else {
            <h1 [ngStyle]="h1Style">Reset password</h1>
            <p [ngStyle]="subtitleStyle">Enter your email and we'll send you a reset link.</p>

            <div style="display:flex;flex-direction:column;gap:14px">
              <div style="display:flex;flex-direction:column;gap:5px">
                <label [ngStyle]="labelStyle">Email</label>
                <input [value]="email()" (input)="email.set($any($event.target).value)"
                       [ngStyle]="inputStyle('email')"
                       (focus)="focused.set('email')" (blur)="focused.set('')"
                       placeholder="you@PeerPilot.school"/>
              </div>
              <app-btn variant="primary" size="lg" (clicked)="submit()" [disabled]="submitting()" style="width:100%">
                {{ submitting() ? 'Sending…' : 'Send reset link' }}
              </app-btn>
            </div>

            @if (errorMsg()) {
              <p [ngStyle]="errorStyle">{{ errorMsg() }}</p>
            }

            <p [ngStyle]="footerStyle">
              Remember your password?
              <span (click)="router.navigate(['/login'])" [ngStyle]="linkStyle">Sign in</span>
            </p>
          }
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  router = inject(Router);
  private auth = inject(AuthService);

  email      = signal('');
  focused    = signal('');
  errorMsg   = signal('');
  submitting = signal(false);
  sent       = signal(false);

  submit() {
    if (!this.email()) { this.errorMsg.set('Email is required.'); return; }
    this.errorMsg.set('');
    this.submitting.set(true);
    this.auth.forgotPassword(this.email()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err.error?.error || 'Something went wrong. Please try again.');
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
  readonly bannerStyle = {
    background: DS.colors.greenSubtle, border: `1px solid ${DS.colors.greenBorder}`,
    color: DS.colors.green, borderRadius: '8px', padding: '12px 14px', fontSize: '0.875rem',
  };
  readonly h1Style       = { fontFamily: DS.fonts.display, fontSize: '1.375rem', fontWeight: '700', color: DS.colors.fg1, marginBottom: '4px' };
  readonly subtitleStyle = { fontSize: '0.875rem', color: DS.colors.fg2, marginBottom: '20px' };
  readonly labelStyle    = { fontSize: '0.8125rem', fontWeight: '500', color: DS.colors.fg2 };
  readonly errorStyle    = { fontSize: '0.75rem', color: DS.colors.red, textAlign: 'center', marginTop: '12px' };
  readonly footerStyle   = { fontSize: '0.75rem', color: DS.colors.fg3, textAlign: 'center', marginTop: '16px' };
  readonly linkStyle     = { color: DS.colors.violet, cursor: 'pointer', marginLeft: '4px' };

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
