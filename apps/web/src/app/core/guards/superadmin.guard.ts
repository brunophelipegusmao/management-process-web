import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../stores/auth.store';

export const superadminGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isSuperAdmin()) return true;

  return router.createUrlTree(['/dashboard']);
};
