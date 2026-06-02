import { Component, inject, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DS } from '../tokens';
import { LogoComponent } from '../shared/logo.component';
import { BtnComponent } from '../shared/btn.component';

@Component({
  selector: 'app-register',
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
          @if (success()) {
            <div [ngStyle]="bannerStyle">
              Registration successful! Check your email for a verification link before signing in.
            </div>
            <app-btn variant="ghost" size="md" (clicked)="router.navigate(['/login'])" style="width:100%;margin-top:8px">
              Back to sign in
            </app-btn>
          } @else {
            <h1 [ngStyle]="h1Style">Create account</h1>
            <p [ngStyle]="subtitleStyle">You need an invite to register.</p>

            <div style="display:flex;flex-direction:column;gap:14px">
              <div style="display:flex;flex-direction:column;gap:5px">
                <label [ngStyle]="labelStyle">Email</label>
                <input [value]="email()" (input)="email.set($any($event.target).value)"
                       [ngStyle]="inputStyle('email')"
                       (focus)="focused.set('email')" (blur)="focused.set('')"
                       placeholder="your.invited@email.com"/>
              </div>
              <div style="display:flex;flex-direction:column;gap:5px">
                <label [ngStyle]="labelStyle">Password</label>
                <input type="password" [value]="password()"
                       (input)="password.set($any($event.target).value)"
                       [ngStyle]="inputStyle('pw')"
                       (focus)="focused.set('pw')" (blur)="focused.set('')"
                       placeholder="••••••••"/>
              </div>
              <div style="display:flex;flex-direction:column;gap:5px">
                <label [ngStyle]="labelStyle">Confirm password</label>
                <input type="password" [value]="confirmPassword()"
                       (input)="confirmPassword.set($any($event.target).value)"
                       [ngStyle]="inputStyle('confirm')"
                       (focus)="focused.set('confirm')" (blur)="focused.set('')"
                       placeholder="••••••••"/>
              </div>
              <app-btn variant="primary" size="lg" (clicked)="submit()" [disabled]="submitting()" style="width:100%">
                {{ submitting() ? 'Creating account…' : 'Create account' }}
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

            <p [ngStyle]="footerStyle">
              Already have an account?
              <span (click)="router.navigate(['/login'])" [ngStyle]="linkStyle">Sign in</span>
            </p>
          }
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  router = inject(Router);
  private auth = inject(AuthService);

  email           = signal('');
  password        = signal('');
  confirmPassword = signal('');
  focused         = signal('');
  errorMsg        = signal('');
  suggestions     = signal<string[]>([]);
  submitting      = signal(false);
  success         = signal(false);

  submit() {
    this.errorMsg.set('');
    this.suggestions.set([]);

    if (!this.email() || !this.password()) {
      this.errorMsg.set('Email and password are required.');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.errorMsg.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.auth.register(this.email(), this.password()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        const body = err.error;
        if (err.status === 403) {
          this.errorMsg.set('This email has not been invited. Contact an administrator.');
        } else if (err.status === 409) {
          this.errorMsg.set('An account with this email already exists.');
        } else if (err.status === 400 && body?.suggestions?.length) {
          this.errorMsg.set('Password is too weak.');
          this.suggestions.set(body.suggestions);
        } else {
          this.errorMsg.set(body?.error || 'Registration failed. Please try again.');
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
  readonly bannerStyle = {
    background: DS.colors.greenSubtle, border: `1px solid ${DS.colors.greenBorder}`,
    color: DS.colors.green, borderRadius: '8px', padding: '12px 14px', fontSize: '0.875rem',
  };
  readonly h1Style = {
    fontFamily: DS.fonts.display, fontSize: '1.375rem', fontWeight: '700',
    color: DS.colors.fg1, marginBottom: '4px',
  };
  readonly subtitleStyle  = { fontSize: '0.875rem', color: DS.colors.fg2, marginBottom: '20px' };
  readonly labelStyle     = { fontSize: '0.8125rem', fontWeight: '500', color: DS.colors.fg2 };
  readonly errorStyle     = { fontSize: '0.75rem', color: DS.colors.red, textAlign: 'center', marginTop: '12px' };
  readonly suggestionsStyle = {
    fontSize: '0.75rem', color: DS.colors.amber, marginTop: '8px',
    paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px',
  };
  readonly footerStyle    = { fontSize: '0.75rem', color: DS.colors.fg3, textAlign: 'center', marginTop: '16px' };
  readonly linkStyle      = { color: DS.colors.violet, cursor: 'pointer', marginLeft: '4px' };

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
