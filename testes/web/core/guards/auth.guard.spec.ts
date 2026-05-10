import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

import { authGuard } from '../../../../apps/web/src/app/core/guards/auth.guard';
import { AuthStore } from '../../../../apps/web/src/app/core/stores/auth.store';

const mockRoute = {} as ActivatedRouteSnapshot;

function mockState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  // -------------------------------------------------------------------------
  describe('on the server (SSR)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
    });

    afterEach(() => TestBed.resetTestingModule());

    it('always returns true during server-side rendering', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState('/dashboard')),
      );

      expect(result).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('in the browser', () => {
    let authStore: AuthStore;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });

      authStore = TestBed.inject(AuthStore);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('returns true when the user is authenticated', () => {
      authStore.setUser({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'Usuário',
        email: 'usuario@teste.com',
        role: 'advogado',
      });

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState('/dashboard')),
      );

      expect(result).toBe(true);
    });

    it('redirects to /login when the user is not authenticated', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState('/dashboard')),
      );

      expect(result).toBeInstanceOf(UrlTree);
      const tree = result as UrlTree;
      expect(tree.toString()).toContain('/login');
    });

    it('includes returnUrl query param with the original destination', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState('/dashboard/kanban')),
      ) as UrlTree;

      expect(result.queryParams['returnUrl']).toBe('/dashboard/kanban');
    });
  });
});
