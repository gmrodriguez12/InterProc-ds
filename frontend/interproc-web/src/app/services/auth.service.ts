import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'usuario';
  mustChangePassword: boolean;
}

export interface SessionResponse {
  user: AuthUser | null;
  setupRequired: boolean;
}

export interface Credentials {
  identifier: string;
  password: string;
}

export interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
}

export type AuthValidationErrors = Record<string, string[]>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private initializationPromise: Promise<void> | null = null;

  readonly currentUser = signal<AuthUser | null>(null);
  readonly setupRequired = signal(false);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly initializationError = signal<string | null>(null);

  initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.restoreSession();
    return this.initializationPromise;
  }

  async retryInitialization(): Promise<void> {
    this.initializationPromise = null;
    this.initializationError.set(null);
    await this.initialize();
  }

  login(credentials: Credentials): Observable<AuthUser> {
    return this.http
      .post<AuthUser>('/api/auth/login', credentials, { withCredentials: true })
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  changePassword(credentials: ChangePasswordCredentials): Observable<AuthUser> {
    return this.http
      .post<AuthUser>('/api/auth/change-password', credentials, { withCredentials: true })
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(tap(() => this.currentUser.set(null)));
  }

  getValidationErrors(error: unknown): AuthValidationErrors {
    if (!(error instanceof HttpErrorResponse) || !isRecord(error.error)) {
      return {};
    }

    const rawErrors = error.error['errors'];
    if (!isRecord(rawErrors)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(rawErrors).flatMap(([key, value]) => {
        const messages = Array.isArray(value)
          ? value.filter((message): message is string => typeof message === 'string')
          : [];
        return messages.length > 0 ? [[lowerFirst(key), messages]] : [];
      }),
    );
  }

  getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'The username/email or password is incorrect.';
      }

      if (isRecord(error.error)) {
        const detail = error.error['detail'];
        const title = error.error['title'];
        if (typeof detail === 'string' && detail.length > 0) {
          return detail;
        }
        if (error.status === 400 && isRecord(error.error['errors'])) {
          return 'Please review the highlighted fields.';
        }
        if (
          typeof title === 'string' &&
          title.length > 0 &&
          title !== 'One or more validation errors occurred.' &&
          title !== 'Bad Request'
        ) {
          return title;
        }
      }
    }

    return fallback;
  }

  private async restoreSession(): Promise<void> {
    try {
      const session = await firstValueFrom(
        this.http.get<SessionResponse>('/api/auth/session', { withCredentials: true }),
      );
      this.currentUser.set(session.user);
      this.setupRequired.set(session.setupRequired);
      this.initializationError.set(null);
    } catch (error: unknown) {
      this.currentUser.set(null);
      this.setupRequired.set(false);
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.initializationError.set(null);
        return;
      }
      this.initializationError.set(
        'InterProc could not connect to the service. Check your connection and try again.',
      );
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function lowerFirst(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toLowerCase() + value.slice(1);
}
