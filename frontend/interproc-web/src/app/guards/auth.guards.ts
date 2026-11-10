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

  const user = auth.currentUser();
  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return user.mustChangePassword ? router.parseUrl('/change-password') : true;
};

export const passwordChangeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }

  const user = auth.currentUser();
  if (!user) {
    return router.parseUrl('/login');
  }

  return user.mustChangePassword ? true : router.parseUrl('/dashboard');
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }

  const user = auth.currentUser();
  if (!user) {
    return router.parseUrl('/login');
  }
  if (user.mustChangePassword) {
    return router.parseUrl('/change-password');
  }

  return user.role === 'admin' ? true : router.parseUrl('/dashboard');
};

export const anonymousGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }

  const user = auth.currentUser();
  if (!user) {
    return true;
  }

  return router.parseUrl(user.mustChangePassword ? '/change-password' : '/dashboard');
};

export const startupRedirectGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();
  if (auth.initializationError()) {
    return false;
  }

  const user = auth.currentUser();
  return router.parseUrl(
    user ? (user.mustChangePassword ? '/change-password' : '/dashboard') : '/login',
  );
};
