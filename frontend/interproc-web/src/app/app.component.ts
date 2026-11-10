import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    @if (showApplicationShell) {
      <div class="shell" [class.sidebar-open]="mobileNavigationOpen" (keydown.escape)="closeNavigation()">
        <aside class="sidebar" id="application-navigation" aria-label="Navegación de InterProc">
          <div class="sidebar__mobile-head">
            <a class="brand" routerLink="/dashboard" (click)="closeNavigation()">
              <span class="brand__mark"><i class="fa-solid fa-diagram-project" aria-hidden="true"></i></span>
              <span class="brand__name">InterProc</span>
            </a>
            <button class="btn btn--ghost icon-btn sidebar__close" type="button" aria-label="Cerrar menú" (click)="closeNavigation()">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <nav class="nav" aria-label="Principal">
            <a class="nav__item" routerLink="/dashboard" routerLinkActive="is-active" ariaCurrentWhenActive="page" (click)="closeNavigation()">
              <i class="fa-solid fa-table-columns" aria-hidden="true"></i><span>Dashboard</span>
            </a>
            <a class="nav__item" routerLink="/procedures" routerLinkActive="is-active" ariaCurrentWhenActive="page" (click)="closeNavigation()">
              <i class="fa-solid fa-book" aria-hidden="true"></i><span>Procedimientos</span>
            </a>
            <a class="nav__item" routerLink="/clients" routerLinkActive="is-active" ariaCurrentWhenActive="page" (click)="closeNavigation()">
              <i class="fa-solid fa-building" aria-hidden="true"></i><span>Clientes</span>
            </a>
            @if (auth.isAdmin()) {
              <span class="nav__section">Administración</span>
              <a class="nav__item" routerLink="/admin/users" routerLinkActive="is-active" ariaCurrentWhenActive="page" (click)="closeNavigation()">
                <i class="fa-solid fa-users" aria-hidden="true"></i><span>Cuentas</span>
              </a>
              <a class="nav__item" routerLink="/admin/audit" routerLinkActive="is-active" ariaCurrentWhenActive="page" (click)="closeNavigation()">
                <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i><span>Auditoría</span>
              </a>
            }
          </nav>

          <div class="sidebar__foot">
            <div class="who">
              <span class="avatar">{{ userInitials }}</span>
              <span class="who__meta">
                <strong>{{ auth.currentUser()?.displayName }}</strong>
                <span>{{ auth.isAdmin() ? 'Admin' : 'Usuario' }} · auditado</span>
              </span>
            </div>
            <button class="linklike" type="button" (click)="logout()" [disabled]="isLoggingOut">
              <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
              {{ isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión' }}
            </button>
          </div>
        </aside>

        <button class="sidebar-scrim" type="button" aria-label="Cerrar menú" (click)="closeNavigation()"></button>

        <main class="main" id="main-content">
          <header class="topbar">
            <div class="crumbs">
              <button class="btn btn--ghost icon-btn mobile-menu" type="button" aria-label="Abrir menú" aria-controls="application-navigation" [attr.aria-expanded]="mobileNavigationOpen" (click)="mobileNavigationOpen = true">
                <i class="fa-solid fa-bars" aria-hidden="true"></i>
              </button>
              <span class="eyebrow">{{ pageLabel }}</span>
            </div>
            <span class="badge mono" [title]="auth.currentUser()?.email ?? ''">{{ auth.currentUser()?.username }}</span>
          </header>

          <div class="content">
            @if (auth.initializationError(); as error) {
              <section class="alert alert--error service-error" role="alert">
                <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                <div><p>{{ error }}</p><button class="btn btn--primary" type="button" (click)="retryInitialization()">Reintentar</button></div>
              </section>
            } @else {
              <router-outlet />
            }
          </div>
        </main>
      </div>
    } @else {
      <main class="auth" id="main-content">
        @if (auth.initializationError(); as error) {
          <section class="alert alert--error service-error" role="alert">
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
            <div><p>{{ error }}</p><button class="btn btn--primary" type="button" (click)="retryInitialization()">Reintentar</button></div>
          </section>
        } @else {
          <router-outlet />
        }
      </main>
    }
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  isLoggingOut = false;
  mobileNavigationOpen = false;

  get showApplicationShell(): boolean {
    return this.auth.isAuthenticated() && !this.auth.currentUser()?.mustChangePassword;
  }

  get userInitials(): string {
    const name = this.auth.currentUser()?.displayName.trim() ?? '';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'IP';
  }

  get pageLabel(): string {
    const path = this.router.url.split('?')[0] ?? '';
    if (path.startsWith('/procedures')) return 'Procedimientos';
    if (path.startsWith('/clients')) return 'Clientes';
    if (path.startsWith('/admin/users')) return 'Cuentas';
    if (path.startsWith('/admin/audit')) return 'Auditoría';
    return 'Dashboard';
  }

  closeNavigation(): void {
    this.mobileNavigationOpen = false;
  }

  async logout(): Promise<void> {
    this.isLoggingOut = true;
    this.auth.initializationError.set(null);
    try {
      await firstValueFrom(this.auth.logout());
      await this.router.navigateByUrl('/login');
    } catch {
      this.auth.initializationError.set('No pudimos cerrar la sesión. Intentá nuevamente.');
    } finally {
      this.isLoggingOut = false;
    }
  }

  async retryInitialization(): Promise<void> {
    await this.auth.retryInitialization();
    if (!this.auth.initializationError()) {
      await this.router.navigateByUrl(
        this.auth.isAuthenticated()
          ? this.auth.currentUser()?.mustChangePassword ? '/change-password' : '/dashboard'
          : '/login',
      );
    }
  }
}
