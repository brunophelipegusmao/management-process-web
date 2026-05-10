const path = require('path');

const root = __dirname;                               // testes/api
const apiRoot = path.resolve(root, '../../apps/api'); // monorepo/apps/api

/** @type {import('jest').Config} */
module.exports = {
  displayName: 'testes-api',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',

  roots: [root],
  testRegex: '\\.spec\\.ts$',

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: path.join(root, 'tsconfig.json') },
    ],
  },

  /**
   * Allow Jest to resolve packages from apps/api/node_modules so that
   * @nestjs/common, drizzle-orm, zod, etc. are found when test files import
   * source modules located inside apps/api/src/.
   */
  moduleDirectories: ['node_modules', path.join(apiRoot, 'node_modules')],

  setupFiles: [path.join(root, 'jest-setup.js')],
};
