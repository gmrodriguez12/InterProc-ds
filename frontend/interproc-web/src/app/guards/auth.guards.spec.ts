import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { adminGuard, authenticatedGuard } from './auth.guards';
import { AuthService, AuthUser } from '../services/auth.service';

describe('authentication guards', () => {
  const currentUser = signal<AuthUser | null>(null);
  const initializationError = signal<string | null>(null);
  const auth = {
    currentUser,
    initializationError,
    initialize: () => Promise.resolve(),
  };

  beforeEach(() => {
    currentUser.set(null);
    initializationError.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  it('redirects a signed-out user to login with the return URL', async () => {
    const result = await TestBed.runInInjectionContext(() => authenticatedGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/dashboard' } as RouterStateSnapshot,
    ));

    expect(String(result)).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('forces a temporary-password account to change it first', async () => {
    currentUser.set(user({ mustChangePassword: true }));

    const result = await TestBed.runInInjectionContext(() => authenticatedGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/dashboard' } as RouterStateSnapshot,
    ));

    expect(String(result)).toBe('/change-password');
  });

  it('allows only an administrator into account management', async () => {
    currentUser.set(user({ role: 'usuario' }));
    const denied = await TestBed.runInInjectionContext(() => adminGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ));
    expect(String(denied)).toBe('/dashboard');

    currentUser.set(user({ role: 'admin' }));
    const allowed = await TestBed.runInInjectionContext(() => adminGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ));
    expect(allowed).toBe(true);
  });
});

function user(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: 'user-1',
    username: 'user.one',
    email: 'user@example.test',
    role: 'usuario',
    mustChangePassword: false,
    ...overrides,
  };
}
