import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard.component';
import { LoginComponent } from './pages/login.component';
import { SignupComponent } from './pages/signup.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Sign in · InterProc' },
  { path: 'signup', component: SignupComponent, title: 'Create account · InterProc' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard · InterProc' },
  { path: '**', redirectTo: 'login' },
];
