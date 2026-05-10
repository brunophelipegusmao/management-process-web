import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
   HttpTestingController,
   provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

import { AuthService } from '../../../../apps/web/src/app/core/services/auth.service';
import { AuthStore } from '../../../../apps/web/src/app/core/stores/auth.store';
import { API_BASE_URL } from '../../../../apps/web/src/app/core/tokens/api-url.token';

const API_URL = 'http://localhost:3001';

const mockUser = {
   id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   name: 'Usuário Teste',
   email: 'usuario@teste.com',
   role: 'advogado',
};

describe('AuthService', () => {
   let service: AuthService;
   let httpMock: HttpTestingController;
   let authStore: AuthStore;

   beforeEach(() => {
      TestBed.configureTestingModule({
         providers: [
            provideExperimentalZonelessChangeDetection(),
            provideHttpClient(),
            provideHttpClientTesting(),
            { provide: API_BASE_URL, useValue: API_URL },
            AuthService,
            AuthStore,
         ],
      });

      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
      authStore = TestBed.inject(AuthStore);
   });

   afterEach(() => {
      httpMock.verify();
      TestBed.resetTestingModule();
   });

   // -------------------------------------------------------------------------
   describe('signIn', () => {
      it('sends credentials to /auth/sign-in/email and stores the user', fakeAsync(() => {
         let resolved = false;

         service
            .signIn('usuario@teste.com', 'senha123')
            .then(() => (resolved = true));

         const req = httpMock.expectOne(`${API_URL}/auth/sign-in/email`);
         expect(req.request.method).toBe('POST');
         expect(req.request.body).toEqual({
            email: 'usuario@teste.com',
            password: 'senha123',
         });
         expect(req.request.withCredentials).toBe(true);

         req.flush({ user: mockUser });
         tick();

         expect(resolved).toBe(true);
         expect(authStore.user()).toEqual(mockUser);
         expect(authStore.isAuthenticated()).toBe(true);
      }));
   });

   // -------------------------------------------------------------------------
   describe('signOut', () => {
      it('sends POST to /auth/sign-out and clears the user from the store', fakeAsync(() => {
         authStore.setUser(mockUser);
         expect(authStore.isAuthenticated()).toBe(true);

         let resolved = false;
         service.signOut().then(() => (resolved = true));

         const req = httpMock.expectOne(`${API_URL}/auth/sign-out`);
         expect(req.request.method).toBe('POST');
         req.flush({});
         tick();

         expect(resolved).toBe(true);
         expect(authStore.user()).toBeNull();
         expect(authStore.isAuthenticated()).toBe(false);
      }));

      it('clears the store even when the sign-out request fails', fakeAsync(() => {
         authStore.setUser(mockUser);

         service.signOut();

         const req = httpMock.expectOne(`${API_URL}/auth/sign-out`);
         req.flush('Server error', {
            status: 500,
            statusText: 'Internal Server Error',
         });
         tick();

         expect(authStore.user()).toBeNull();
      }));
   });

   // -------------------------------------------------------------------------
   describe('getSession', () => {
      it('returns the user when the session endpoint responds with a user', fakeAsync(async () => {
         let result: unknown;

         service.getSession().then(u => (result = u));

         const req = httpMock.expectOne(`${API_URL}/auth/get-session`);
         expect(req.request.method).toBe('GET');
         req.flush({ user: mockUser });
         tick();

         expect(result).toEqual(mockUser);
      }));

      it('returns null when the session endpoint returns { user: null }', fakeAsync(async () => {
         let result: unknown = 'not-set';

         service.getSession().then(u => (result = u));

         const req = httpMock.expectOne(`${API_URL}/auth/get-session`);
         req.flush({ user: null });
         tick();

         expect(result).toBeNull();
      }));

      it('returns null when the session request fails', fakeAsync(() => {
         let result: unknown = 'not-set';

         service.getSession().then(u => (result = u));

         const req = httpMock.expectOne(`${API_URL}/auth/get-session`);
         req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
         tick();

         expect(result).toBeNull();
      }));
   });

   // -------------------------------------------------------------------------
   describe('restoreSession', () => {
      it('stores the user when a valid session exists', fakeAsync(() => {
         service.restoreSession();

         const req = httpMock.expectOne(`${API_URL}/auth/get-session`);
         req.flush({ user: mockUser });
         tick();

         expect(authStore.user()).toEqual(mockUser);
      }));

      it('clears the store when no session exists', fakeAsync(() => {
         authStore.setUser(mockUser); // pre-populate

         service.restoreSession();

         const req = httpMock.expectOne(`${API_URL}/auth/get-session`);
         req.flush({ user: null });
         tick();

         expect(authStore.user()).toBeNull();
      }));
   });
});
