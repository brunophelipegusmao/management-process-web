import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const testsRoot = __dirname; // /testes/web
const webRoot = resolve(testsRoot, '../../apps/web'); // /apps/web
const webModules = resolve(webRoot, 'node_modules');

/**
 * Map an Angular sub-entry (e.g. "@angular/core/testing") to the fesm2022
 * bundle inside apps/web/node_modules.
 *
 * Pattern:  @angular/<pkg>/<sub>  →  node_modules/@angular/<pkg>/fesm2022/<sub>.mjs
 * Pattern:  @angular/<pkg>        →  node_modules/@angular/<pkg>/fesm2022/<pkg>.mjs
 *
 * Special cases:
 *   @angular/common/http          →  fesm2022/http.mjs
 *   @angular/common/http/testing  →  fesm2022/http-testing.mjs
 */
function angularAlias(pkg: string, sub?: string) {
   const find = sub ? `@angular/${pkg}/${sub}` : `@angular/${pkg}`;
   const file = sub === 'http/testing' ? 'http-testing' : (sub ?? pkg);
   const replacement = resolve(
      webModules,
      `@angular/${pkg}/fesm2022/${file}.mjs`,
   );
   return { find, replacement };
}

export default defineConfig({
   /**
    * root anchors Vite to apps/web/ so that bare package imports (Angular, rxjs)
    * are resolved from apps/web/node_modules.
    */
   root: webRoot,

   resolve: {
      alias: [
         // Angular sub-entries (must come before the bare package aliases)
         angularAlias('core', 'testing'),
         angularAlias('common', 'http/testing'),
         angularAlias('common', 'http'),
         angularAlias('common', 'testing'),
         angularAlias('router', 'testing'),
         angularAlias('platform-browser', 'testing'),
         // Angular bare packages
         angularAlias('core'),
         angularAlias('common'),
         angularAlias('router'),
         angularAlias('platform-browser'),
         angularAlias('forms'),
         angularAlias('compiler'),
         // rxjs sub-entries
         {
            find: 'rxjs/operators',
            replacement: resolve(
               webModules,
               'rxjs/dist/cjs/operators/index.js',
            ),
         },
         {
            find: 'rxjs',
            replacement: resolve(webModules, 'rxjs/dist/cjs/index.js'),
         },
      ],
   },

   test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: [resolve(testsRoot, 'setup.ts')],
      include: [`${testsRoot}/**/*.spec.ts`],
      testTimeout: 10_000,
   },
});
