import { Injectable, signal, computed } from '@angular/core';
import { User, UserProfile } from './tokens';

const STORAGE_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadFromStorage());

  readonly user       = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly role       = computed(() => this._user()?.role ?? null);

  login(user: User): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._user.set(null);
  }

  private loadFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  }

  updateUser(partial: { profile?: Partial<UserProfile> }): void {
    this._user.update(u => {
      if (!u) return u;
      const updated = {
        ...u,
        profile: u.profile
          ? { ...u.profile, ...partial.profile }
          : partial.profile as UserProfile,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }
}
