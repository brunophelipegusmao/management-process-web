import { AuthStore } from '../../../../apps/web/src/app/core/stores/auth.store';

/**
 * AuthStore uses Angular Signals (signal, computed) which are standalone
 * reactive primitives — no TestBed or injection context is required.
 * We can instantiate the store directly with `new AuthStore()`.
 */
describe('AuthStore', () => {
   let store: AuthStore;

   beforeEach(() => {
      store = new AuthStore();
   });

   // -------------------------------------------------------------------------
   describe('initial state', () => {
      it('user signal is null', () => {
         expect(store.user()).toBeNull();
      });

      it('isAuthenticated computed signal is false', () => {
         expect(store.isAuthenticated()).toBe(false);
      });

      it('isSuperAdmin computed signal is false', () => {
         expect(store.isSuperAdmin()).toBe(false);
      });
   });

   // -------------------------------------------------------------------------
   describe('setUser', () => {
      const regularUser = {
         id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
         name: 'João Advogado',
         email: 'joao@escritorio.com',
         role: 'advogado',
      };

      it('stores the provided user in the signal', () => {
         store.setUser(regularUser);
         expect(store.user()).toEqual(regularUser);
      });

      it('sets isAuthenticated to true when a user is set', () => {
         store.setUser(regularUser);
         expect(store.isAuthenticated()).toBe(true);
      });

      it('sets isAuthenticated back to false when user is cleared', () => {
         store.setUser(regularUser);
         store.setUser(null);
         expect(store.isAuthenticated()).toBe(false);
      });

      it('clears the user when null is passed', () => {
         store.setUser(regularUser);
         store.setUser(null);
         expect(store.user()).toBeNull();
      });
   });

   // -------------------------------------------------------------------------
   describe('isSuperAdmin', () => {
      it('returns true when the user role is "superadmin"', () => {
         store.setUser({
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            name: 'Admin',
            email: 'admin@escritorio.com',
            role: 'superadmin',
         });
         expect(store.isSuperAdmin()).toBe(true);
      });

      it('returns false for role "advogado"', () => {
         store.setUser({
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            name: 'Advogado',
            email: 'adv@escritorio.com',
            role: 'advogado',
         });
         expect(store.isSuperAdmin()).toBe(false);
      });

      it('returns false for role "paralegal"', () => {
         store.setUser({
            id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            name: 'Paralegal',
            email: 'para@escritorio.com',
            role: 'paralegal',
         });
         expect(store.isSuperAdmin()).toBe(false);
      });

      it('returns false when no user is set', () => {
         expect(store.isSuperAdmin()).toBe(false);
      });
   });
});
