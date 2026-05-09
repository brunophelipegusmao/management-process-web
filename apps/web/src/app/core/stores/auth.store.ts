import { Injectable, computed, signal } from '@angular/core';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isSuperAdmin = computed(() => this._user()?.role === 'superadmin');

  setUser(user: AuthUser | null): void {
    this._user.set(user);
  }
}
