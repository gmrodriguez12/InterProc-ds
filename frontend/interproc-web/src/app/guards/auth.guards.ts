import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authenticatedGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([
    auth.setupStatus()?.hasUsers === false ? '/signup' : '/login',
  ], {
    queryParams: { returnUrl: state.url },
  });
};

export const anonymousGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }

  if (auth.isAuthenticated()) {
    return router.parseUrl('/dashboard');
  }

  if (auth.setupStatus()?.hasUsers === false && state.url.startsWith('/login')) {
    return router.parseUrl('/signup');
  }

  return true;
};

export const startupRedirectGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }

  return router.parseUrl(
    auth.isAuthenticated()
      ? '/dashboard'
      : auth.setupStatus()?.hasUsers === false
        ? '/signup'
        : '/login',
  );
};
