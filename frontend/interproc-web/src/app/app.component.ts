import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-frame">
      <header class="topbar">
        <a class="brand" routerLink="/login" aria-label="InterProc home">
          <span class="brand-mark" aria-hidden="true">I</span>
          <span>interproc</span>
        </a>

        <nav class="main-nav" aria-label="Main navigation">
          @if (auth.isAuthenticated()) {
            <a routerLink="/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page">Dashboard</a>
            <button class="nav-button" type="button" (click)="logout()" [disabled]="isLoggingOut">
              {{ isLoggingOut ? 'Signing out…' : 'Sign out' }}
            </button>
          } @else {
            <a routerLink="/login" routerLinkActive="active" ariaCurrentWhenActive="page">Sign in</a>
            <a routerLink="/signup" routerLinkActive="active" ariaCurrentWhenActive="page">Create account</a>
          }
        </nav>

        <span class="workspace-label">
          <span class="status-dot" aria-hidden="true"></span>
          Workspace
        </span>
      </header>

      <main class="page-content">
        @if (auth.initializationError(); as error) {
          <section class="service-error" role="alert">
            <p>{{ error }}</p>
            <button class="button button-primary" type="button" (click)="retryInitialization()">
              Try again
            </button>
          </section>
        } @else {
          <router-outlet />
        }
      </main>

      <footer class="footer">
        <span>InterProc</span>
        <span>Process clarity, built together.</span>
      </footer>
    </div>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  isLoggingOut = false;

  async logout(): Promise<void> {
    this.isLoggingOut = true;
    this.auth.initializationError.set(null);
    try {
      await firstValueFrom(this.auth.logout());
      await this.router.navigateByUrl('/login');
    } catch {
      this.auth.initializationError.set('We could not sign you out. Please try again.');
    } finally {
      this.isLoggingOut = false;
    }
  }

  async retryInitialization(): Promise<void> {
    await this.auth.retryInitialization();
    if (!this.auth.initializationError()) {
      await this.router.navigateByUrl(
        this.auth.isAuthenticated()
          ? '/dashboard'
          : this.auth.setupStatus()?.hasUsers === false
            ? '/signup'
            : '/login',
      );
    }
  }
}
