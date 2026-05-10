import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const testsRoot = __dirname; // /testes/web
const webRoot = resolve(testsRoot, '../../apps/web'); // /apps/web

export default defineConfig({
   /**
    * By running vitest from `apps/web/` the resolver finds Angular packages in
    * apps/web/node_modules automatically.  The `root` option here keeps Vite
    * anchored to apps/web so that relative module resolution works.
    *
    * Run command (from the monorepo root):
    *   pnpm --filter @mgmt/web exec vitest run --config ../../testes/web/vitest.config.ts
    */
   root: webRoot,

   test: {
      /**
       * jsdom is needed for isPlatformBrowser() to return the correct value in
       * guard tests, and for any DOM-related Angular APIs.
       */
      environment: 'jsdom',

      globals: true,

      /**
       * setupFiles run before every test file.  The setup.ts imports
       * @angular/compiler which is required for TestBed JIT compilation.
       */
      setupFiles: [resolve(testsRoot, 'setup.ts')],

      /**
       * Override the default include pattern so Vitest picks up spec files from
       * the /testes/web/ tree instead of apps/web/src/.
       */
      include: [`${testsRoot}/**/*.spec.ts`],

      /**
       * Increase timeout slightly for TestBed async setup.
       */
      testTimeout: 10_000,
   },
});
