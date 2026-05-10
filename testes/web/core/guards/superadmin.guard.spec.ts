import { TestBed } from '@angular/core/testing';
import {
   ActivatedRouteSnapshot,
   RouterStateSnapshot,
   UrlTree,
   provideRouter,
} from '@angular/router';
import {
   PLATFORM_ID,
   provideExperimentalZonelessChangeDetection,
} from '@angular/core';

import { superadminGuard } from '../../../../apps/web/src/app/core/guards/superadmin.guard';
import { AuthStore } from '../../../../apps/web/src/app/core/stores/auth.store';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('superadminGuard', () => {
   // -------------------------------------------------------------------------
   describe('on the server (SSR)', () => {
      beforeEach(() => {
         TestBed.configureTestingModule({
            providers: [
               provideExperimentalZonelessChangeDetection(),
               provideRouter([]),
               { provide: PLATFORM_ID, useValue: 'server' },
            ],
         });
      });

      afterEach(() => TestBed.resetTestingModule());

      it('always returns true during server-side rendering', () => {
         const result = TestBed.runInInjectionContext(() =>
            superadminGuard(mockRoute, mockState),
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
               provideExperimentalZonelessChangeDetection(),
               provideRouter([]),
               { provide: PLATFORM_ID, useValue: 'browser' },
            ],
         });

         authStore = TestBed.inject(AuthStore);
      });

      afterEach(() => TestBed.resetTestingModule());

      it('returns true when the user is superadmin', () => {
         authStore.setUser({
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            name: 'Super Admin',
            email: 'admin@escritorio.com',
            role: 'superadmin',
         });

         const result = TestBed.runInInjectionContext(() =>
            superadminGuard(mockRoute, mockState),
         );

         expect(result).toBe(true);
      });

      it('redirects to /dashboard when the user is advogado', () => {
         authStore.setUser({
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            name: 'Advogado',
            email: 'adv@escritorio.com',
            role: 'advogado',
         });

         const result = TestBed.runInInjectionContext(() =>
            superadminGuard(mockRoute, mockState),
         );

         expect(result).toBeInstanceOf(UrlTree);
         expect((result as UrlTree).toString()).toContain('/dashboard');
      });

      it('redirects to /dashboard when the user is paralegal', () => {
         authStore.setUser({
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            name: 'Paralegal',
            email: 'para@escritorio.com',
            role: 'paralegal',
         });

         const result = TestBed.runInInjectionContext(() =>
            superadminGuard(mockRoute, mockState),
         );

         expect(result).toBeInstanceOf(UrlTree);
      });

      it('redirects to /dashboard when no user is authenticated', () => {
         // store is empty by default
         const result = TestBed.runInInjectionContext(() =>
            superadminGuard(mockRoute, mockState),
         );

         expect(result).toBeInstanceOf(UrlTree);
         expect((result as UrlTree).toString()).toContain('/dashboard');
      });
   });
});
