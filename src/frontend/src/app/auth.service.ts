import { Injectable, signal, computed } from '@angular/core';
import { User } from './tokens';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);

  readonly user   = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly role       = computed(() => this._user()?.role ?? null);

  login(user: User): void { this._user.set(user); }
  logout(): void           { this._user.set(null); }

  
}
