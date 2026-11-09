import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface SetupStatus {
  hasUsers: boolean;
}

export interface Credentials {
  email: string;
  password: string;
}

export type AuthValidationErrors = Record<string, string[]>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private initializationPromise: Promise<void> | null = null;

  readonly currentUser = signal<AuthUser | null>(null);
  readonly setupStatus = signal<SetupStatus | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
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

  signup(credentials: Credentials): Observable<AuthUser> {
    return this.http
      .post<AuthUser>('/api/auth/signup', credentials, { withCredentials: true })
      .pipe(
        tap((user) => {
          this.currentUser.set(user);
          this.setupStatus.set({ hasUsers: true });
        }),
      );
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
        return messages.length > 0 ? [[key.toLowerCase(), messages]] : [];
      }),
    );
  }

  getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'The email or password is incorrect.';
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
      const status = await firstValueFrom(
        this.http.get<SetupStatus>('/api/auth/setup-status', { withCredentials: true }),
      );
      this.setupStatus.set(status);

      if (!status.hasUsers) {
        this.currentUser.set(null);
        this.initializationError.set(null);
        return;
      }

      try {
        const user = await firstValueFrom(
          this.http.get<AuthUser>('/api/auth/me', { withCredentials: true }),
        );
        this.currentUser.set(user);
      } catch (error: unknown) {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          throw error;
        }
        this.currentUser.set(null);
      }

      this.initializationError.set(null);
    } catch {
      this.setupStatus.set(null);
      this.currentUser.set(null);
      this.initializationError.set(
        'InterProc could not connect to the service. Check your connection and try again.',
      );
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
