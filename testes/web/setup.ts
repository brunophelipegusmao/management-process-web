/**
 * Angular test setup for Vitest.
 *
 * @angular/compiler must be imported FIRST so that the JIT compiler is
 * available when Angular loads decorators at module initialisation time.
 * Without this, @angular/common (http, router, …) throws:
 *   "The injectable 'X' needs to be compiled using the JIT compiler,
 *    but '@angular/compiler' is not available."
 */
import '@angular/compiler';
