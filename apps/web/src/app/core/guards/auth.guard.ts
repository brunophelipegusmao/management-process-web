import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  // During SSR the APP_INITIALIZER never calls restoreSession(), so the store
  // is always empty. Returning true lets the server render the shell; the
  // browser guard (same code, runs after hydration) enforces real auth.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
