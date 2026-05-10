import { APP_INITIALIZER, ApplicationConfig, PLATFORM_ID, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { API_BASE_URL } from './core/tokens/api-url.token';
import { AuthService } from './core/services/auth.service';
import { httpCacheInterceptor } from './core/interceptors/http-cache.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([httpCacheInterceptor])),
    { provide: API_BASE_URL, useValue: 'http://localhost:3001' },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authService = inject(AuthService);
        const platformId = inject(PLATFORM_ID);
        return () => isPlatformBrowser(platformId)
          ? authService.restoreSession()
          : Promise.resolve();
      },
      multi: true,
    },
  ]
};
