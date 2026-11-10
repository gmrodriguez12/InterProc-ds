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
    return auth.currentUser()?.mustChangePassword && state.url !== '/change-password'
      ? router.parseUrl('/change-password')
      : true;
  }

  return router.createUrlTree(['/login'], {
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
    return router.parseUrl(auth.currentUser()?.mustChangePassword ? '/change-password' : '/dashboard');
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
      ? auth.currentUser()?.mustChangePassword ? '/change-password' : '/dashboard'
      : '/login',
  );
};

export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (auth.currentUser()?.mustChangePassword) {
    return router.parseUrl('/change-password');
  }
  return auth.isAdmin() ? true : router.parseUrl('/dashboard');
};
