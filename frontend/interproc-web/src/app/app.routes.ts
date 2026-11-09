import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard.component';
import { LoginComponent } from './pages/login.component';
import { SignupComponent } from './pages/signup.component';
import {
  anonymousGuard,
  authenticatedGuard,
  startupRedirectGuard,
} from './guards/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [startupRedirectGuard], component: LoginComponent },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [anonymousGuard],
    title: 'Sign in · InterProc',
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [anonymousGuard],
    title: 'Create account · InterProc',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authenticatedGuard],
    title: 'Dashboard · InterProc',
  },
  { path: '**', canActivate: [startupRedirectGuard], component: LoginComponent },
];
