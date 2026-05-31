import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = '/api/auth';
  private accessToken = signal<string | null>(null);
  private userSignal  = signal<any>(null);

  // Guards wait on this before deciding redirect — prevents flash to /login on page refresh
  readonly initialized = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    // Silent token refresh on every page load using the httpOnly cookie.
    // No localStorage — the access token lives only in memory.
    this.refreshToken().subscribe({
      next: res => {
        this.accessToken.set(res.accessToken);
        this.getMe().subscribe({
          next: () => this.initialized.set(true),
          error: () => this.initialized.set(true),
        });
      },
      error: () => this.initialized.set(true),
    });
  }

  get user() { return this.userSignal.asReadonly(); }

  login(email: string, password: string): Observable<any> {
    return this.http.post<{ accessToken: string }>(`${this.api}/login`, { email, password })
      .pipe(tap(res => this.setToken(res.accessToken)));
  }

  logout(): void {
    this.http.post(`${this.api}/logout`, {}).subscribe({
      next: () => this.cleanup(),
      error: () => this.cleanup(),
    });
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.api}/refresh`, {});
  }

  private cleanup() {
    this.clearToken();
    this.router.navigate(['/login']);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.api}/me`).pipe(tap(user => this.userSignal.set(user)));
  }

  setToken(token: string): void {
    this.accessToken.set(token);
    this.getMe().subscribe();
  }

  getToken(): string | null  { return this.accessToken(); }

  clearToken(): void {
    this.accessToken.set(null);
    this.userSignal.set(null);
  }

  isLoggedIn(): boolean { return !!this.accessToken(); }
  getRole(): string | null { return this.user()?.role ?? null; }

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.api}/register`, { email, password });
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.api}/verify-email`, { params: { token } });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.api}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.api}/reset-password`, { token, newPassword });
  }

  loginWithGitHub(): void { window.location.href = `${this.api}/github`; }

  handleOAuthCallback(fragment: string): boolean {
    const token = new URLSearchParams(fragment).get('accessToken');
    if (token) { this.setToken(token); return true; }
    return false;
  }
}