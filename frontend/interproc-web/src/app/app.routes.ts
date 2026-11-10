import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard.component';
import { LoginComponent } from './pages/login.component';
import { ChangePasswordComponent } from './pages/change-password.component';
import { UsersComponent } from './pages/users.component';
import { AuditComponent } from './pages/audit.component';
import { ProceduresComponent } from './pages/procedures.component';
import { ClientsComponent } from './pages/clients.component';
import { pendingChangesGuard } from './guards/pending-changes.guard';
import {
  adminGuard,
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
  { path: 'procedures', component: ProceduresComponent, canActivate: [authenticatedGuard], title: 'Procedures · InterProc' },
  { path: 'clients', component: ClientsComponent, canActivate: [authenticatedGuard], canDeactivate: [pendingChangesGuard], title: 'Clients · InterProc' },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authenticatedGuard], title: 'Change password · InterProc' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authenticatedGuard],
    title: 'Dashboard · InterProc',
  },
  { path: 'admin/users', component: UsersComponent, canActivate: [adminGuard], title: 'Accounts · InterProc' },
  { path: 'admin/audit', component: AuditComponent, canActivate: [adminGuard], title: 'Audit · InterProc' },
  { path: '**', canActivate: [startupRedirectGuard], component: LoginComponent },
];
