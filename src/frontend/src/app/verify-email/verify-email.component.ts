import { Component, OnInit, inject, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { DS } from '../tokens';
import { LogoComponent } from '../shared/logo.component';
import { BtnComponent } from '../shared/btn.component';

@Component({
  selector: 'app-verify-email',
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
          @if (status() === 'loading') {
            <p [ngStyle]="bodyStyle">{{ 'verify_email_loading' | translate }}</p>
          }
          @if (status() === 'success') {
            <div [ngStyle]="bannerStyle('green')">
              {{ 'verify_email_success' | translate }}
            </div>
          }
          @if (status() === 'error') {
            <div [ngStyle]="bannerStyle('red')">
              {{ errorMsg() }}
            </div>
            <app-btn variant="ghost" size="md" (clicked)="router.navigate(['/login'])" style="width:100%;margin-top:16px">
              {{ 'btn_back_to_sign_in' | translate }}
            </app-btn>
          }
        </div>
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  router = inject(Router);
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  status   = signal<'loading' | 'success' | 'error'>('loading');
  errorMsg = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.status.set('error');
      this.errorMsg.set(this.translate.instant('error_no_verification_token'));
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { verified: 'true' } });
        }, 2500);
      },
      error: (err) => {
        this.status.set('error');
        this.errorMsg.set(err.error?.error || this.translate.instant('error_verification_failed'));
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
  readonly bodyStyle = { fontSize: '0.9375rem', color: DS.colors.fg2, textAlign: 'center' };

  bannerStyle(color: 'green' | 'red') {
    const c = color === 'green'
      ? { bg: DS.colors.greenSubtle, border: DS.colors.greenBorder, text: DS.colors.green }
      : { bg: DS.colors.redSubtle,   border: DS.colors.redBorder,   text: DS.colors.red   };
    return {
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: '8px', padding: '12px 14px', fontSize: '0.875rem',
    };
  }
}
