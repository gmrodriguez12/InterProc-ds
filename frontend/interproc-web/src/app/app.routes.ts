import { Routes } from '@angular/router';

import { AccountsComponent } from './pages/accounts.component';
import { ChangePasswordComponent } from './pages/change-password.component';
import { DashboardComponent } from './pages/dashboard.component';
import { LoginComponent } from './pages/login.component';
import {
  adminGuard,
  anonymousGuard,
  authenticatedGuard,
  passwordChangeGuard,
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
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [passwordChangeGuard],
    title: 'Change password · InterProc',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authenticatedGuard],
    title: 'Dashboard · InterProc',
  },
  {
    path: 'accounts',
    component: AccountsComponent,
    canActivate: [adminGuard],
    title: 'Accounts · InterProc',
  },
  { path: '**', canActivate: [startupRedirectGuard], component: LoginComponent },
];
