import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgStyle } from '@angular/common';
import { LogoComponent } from '../../shared/logo.component';
import { BtnComponent } from '../../shared/btn.component';
import { DS } from '../../tokens';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NgStyle, LogoComponent, BtnComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  focused = signal('');
  error = signal('');   // note: property name 'error', not 'errorMsg'

  onSubmit() {          // note: method name 'onSubmit'
    this.error.set('');
    this.auth.login(this.email(), this.password()).subscribe({
      next: () => {
        const user = this.auth.user();   // call the signal to get user object
        const role = user?.role || 'Student';
        const dest = (role === 'Admin' || role === 'Bocal') ? '/bocal' : '/dashboard';
        this.router.navigate([dest]);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Login failed');
      }
    });
  }

  loginWithGitHub() {
    this.auth.loginWithGitHub();
  }

  // ========== YOUR EXISTING STYLE GETTERS (copy from your old login.ts) ==========
  readonly pageStyle = { /* keep your object */ };
  readonly gridStyle = { /* keep your object */ };
  readonly glowStyle = { /* keep your object */ };
  readonly cardStyle = { /* keep your object */ };
  readonly h1Style = { /* keep your object */ };
  readonly subtitleStyle = { /* keep your object */ };
  readonly labelStyle = { /* keep your object */ };
  readonly footerStyle = { /* keep your object */ };
  readonly errorStyle = { fontSize: '0.75rem', color: DS.colors.red, textAlign: 'center', marginTop: '12px' };

  inputStyle(id: string) { /* keep your existing code */ }
}