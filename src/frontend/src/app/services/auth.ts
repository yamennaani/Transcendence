import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = '/api/auth';
  private tokenKey = 'access_token';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<{ accessToken: string }>(`${this.api}/login`, { email, password })
      .pipe(tap(res => this.setToken(res.accessToken)));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.api}/logout`, {}).pipe(tap(() => this.clearToken()));
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.api}/me`);
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.api}/refresh`, {});
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  loginWithGitHub(): void {
    window.location.href = `${this.api}/github`;
  }

  handleOAuthCallback(fragment: string): boolean {
    const params = new URLSearchParams(fragment);
    const token = params.get('accessToken');
    if (token) {
      this.setToken(token);
      return true;
    }
    return false;
  }
}
