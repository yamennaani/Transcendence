import { Component, inject, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DS, User } from '../tokens';
import { LogoComponent } from '../shared/logo.component';
import { BtnComponent } from '../shared/btn.component';
import { UserService } from '../core/services/user-service/user-service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgStyle, LogoComponent, BtnComponent],
  template: `
    <div [ngStyle]="pageStyle">
      <!-- Grid background -->
      <div [ngStyle]="gridStyle"></div>
      <!-- Glow -->
      <div [ngStyle]="glowStyle"></div>

      <div style="position:relative;width:100%;max-width:400px">
        <div style="margin-bottom:32px;display:flex;justify-content:center">
          <app-logo [size]="28"/>
        </div>

        <div [ngStyle]="cardStyle">
          <h1 [ngStyle]="h1Style">Sign in</h1>
          <p [ngStyle]="subtitleStyle">Your peer-to-peer learning platform.</p>

          <!-- Form -->
          <div style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;flex-direction:column;gap:5px">
              <label [ngStyle]="labelStyle">Email</label>
              <input [value]="email()" (input)="email.set($any($event.target).value)"
                     [ngStyle]="inputStyle('email')"
                     (focus)="focused.set('email')" (blur)="focused.set('')"
                     placeholder="you@43.school"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px">
              <label [ngStyle]="labelStyle">Password</label>
              <input type="password" [value]="password()"
                     (input)="password.set($any($event.target).value)"
                     [ngStyle]="inputStyle('pw')"
                     (focus)="focused.set('pw')" (blur)="focused.set('')"
                     placeholder="••••••••"/>
            </div>
            <app-btn variant="primary" size="lg" (clicked)="login()" style="width:100%">
              Sign in
            </app-btn>
          </div>

          <p [ngStyle]="footerStyle">You cannot evaluate your own submission.</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private user = inject(UserService);

  role     = signal<string>('student');
  email    = signal('');
  password = signal('');
  focused  = signal('');

  login() {
    const data = {
      email: this.email(),
      username:"",
      password:this.password()
    }
    this.user.loginUser(data).subscribe({
      next:(user: any)=>{
        this.role.set(user.role);
        this.auth.login(user);
        const dest = (user.role === 'Admin' || user.role === 'Bocal') ? '/bocal': '/dashboard'
        this.router.navigate([dest]);
      },
      error: (err)=>{
        console.log(err.error)
      }
    })
  }

  // Styles
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
  readonly h1Style = {
    fontFamily: DS.fonts.display, fontSize: '1.375rem', fontWeight: '700',
    color: DS.colors.fg1, marginBottom: '4px',
  };
  readonly subtitleStyle = { fontSize: '0.875rem', color: DS.colors.fg2, marginBottom: '20px' };
  readonly switchLabelStyle = {
    fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.08em',
    textTransform: 'uppercase', color: DS.colors.fg3, marginBottom: '8px',
  };
  readonly labelStyle = { fontSize: '0.8125rem', fontWeight: '500', color: DS.colors.fg2 };
  readonly footerStyle = { fontSize: '0.75rem', color: DS.colors.fg3, textAlign: 'center', marginTop: '16px' };

  roleTabStyle(r: string) {
    const active = this.role() === r;
    return {
      flex: '1', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
      fontSize: '0.8125rem', fontWeight: '500', textTransform: 'capitalize',
      fontFamily: DS.fonts.body, transition: 'all 150ms',
      background: active ? DS.colors.violetSubtle : DS.colors.surfaceRaised,
      color:      active ? DS.colors.violet : DS.colors.fg2,
      border:     `1px solid ${active ? DS.colors.violetBorder : DS.colors.border}`,
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
