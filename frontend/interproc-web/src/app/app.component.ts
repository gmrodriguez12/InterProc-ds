import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
          <a routerLink="/login" routerLinkActive="active" ariaCurrentWhenActive="page">Sign in</a>
          <a routerLink="/signup" routerLinkActive="active" ariaCurrentWhenActive="page">Create account</a>
          <a routerLink="/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page">Dashboard</a>
        </nav>

        <span class="workspace-label">
          <span class="status-dot" aria-hidden="true"></span>
          Workspace
        </span>
      </header>

      <main class="page-content">
        <router-outlet />
      </main>

      <footer class="footer">
        <span>InterProc</span>
        <span>Process clarity, built together.</span>
      </footer>
    </div>
  `,
})
export class AppComponent {}
