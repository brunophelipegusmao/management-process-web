/**
 * Jest setup file — runs before any test module is loaded.
 * Sets required environment variables so that app-env.ts does not throw
 * when DATABASE_URL / BETTER_AUTH_SECRET are absent in the CI environment.
 * dotenv does NOT override variables that are already set, so production
 * values are never clobbered here.
 */
process.env.DATABASE_URL =
   process.env.DATABASE_URL ?? 'postgres://test:test@localhost:5432/test_unit';
process.env.BETTER_AUTH_SECRET =
   process.env.BETTER_AUTH_SECRET ??
   'test-secret-value-for-unit-tests-only-32c';
process.env.BETTER_AUTH_URL =
   process.env.BETTER_AUTH_URL ?? 'http://localhost:3001';
process.env.BETTER_AUTH_BASE_PATH =
   process.env.BETTER_AUTH_BASE_PATH ?? '/auth';

// Clear reCAPTCHA key so that ContactService skips verification in unit tests.
// dotenv will not override a variable that is already set, so setting it here
// (before app-env.ts is loaded) prevents the real key from being applied.
process.env.RECAPTCHA_SECRET_KEY = '';