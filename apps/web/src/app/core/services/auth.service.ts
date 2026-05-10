import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-url.token';
import { AuthStore } from '../stores/auth.store';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SignInResponse {
  user: AuthUser;
}

interface SessionResponse {
  user: AuthUser | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly authStore = inject(AuthStore);

  async signIn(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<SignInResponse>(
        `${this.apiUrl}/auth/sign-in/email`,
        { email, password },
        { withCredentials: true },
      ),
    );

    this.authStore.setUser({ id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role });
  }

  async signOut(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/sign-out`, {}, { withCredentials: true }),
      );
    } finally {
      this.authStore.setUser(null);
    }
  }

  async getSession(): Promise<AuthUser | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<SessionResponse>(
          `${this.apiUrl}/auth/get-session`,
          { withCredentials: true },
        ),
      );
      return res.user ?? null;
    } catch {
      return null;
    }
  }

  async restoreSession(): Promise<void> {
    const user = await this.getSession();
    this.authStore.setUser(
      user
        ? { id: user.id, name: user.name, email: user.email, role: user.role }
        : null,
    );
  }
}
