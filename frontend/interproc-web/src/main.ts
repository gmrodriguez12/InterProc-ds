import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { provideAppInitializer, provideZoneChangeDetection, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthService } from './app/services/auth.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
}).catch((error: unknown) => console.error(error));
