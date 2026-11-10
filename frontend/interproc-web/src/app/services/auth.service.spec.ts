import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('restores the authenticated account and setup state', async () => {
    const initialization = service.initialize();
    http.expectOne('/api/auth/session').flush({
      user: {
        id: 'admin-1',
        username: 'admin.one',
        email: 'admin@example.test',
        role: 'admin',
        mustChangePassword: false,
      },
      setupRequired: false,
    });

    await initialization;

    expect(service.currentUser()?.username).toBe('admin.one');
    expect(service.isAdmin()).toBe(true);
    expect(service.initializationError()).toBeNull();
  });

  it('treats an unauthorized restored session as signed out, not as a service failure', async () => {
    const initialization = service.initialize();
    http.expectOne('/api/auth/session').flush(
      { title: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await initialization;

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.initializationError()).toBeNull();
  });
});
