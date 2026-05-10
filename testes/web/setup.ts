/**
 * Minimal setup for Angular unit tests running under Vitest.
 *
 * @angular/compiler (JIT template compiler) is NOT imported here because
 * this suite tests stores, services, guards, and interceptors — none of which
 * require template compilation.  If component tests are added later, add:
 *   import '@angular/compiler';
 * before any TestBed.configureTestingModule call that uses Angular templates.
 */
