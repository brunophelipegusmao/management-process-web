# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

```
management-process-web/   ← monorepo root
├── apps/
│   ├── web/              ← Angular 21 frontend (@mgmt/web)
│   └── api/              ← NestJS + Fastify backend (@mgmt/api)
├── package.json          ← workspace root scripts
└── pnpm-workspace.yaml
```

## Commands

All commands run from the **monorepo root** using pnpm workspaces.

```bash
# Development
pnpm dev          # run web + api in parallel
pnpm dev:web      # Angular only (port 3000)
pnpm dev:api      # NestJS only (port 3001)

# Build & Lint
pnpm build        # build all apps
pnpm lint         # lint all apps

# Database (API)
pnpm db:generate  # generate Drizzle migrations
pnpm db:migrate   # run migrations
pnpm db:studio    # open Drizzle Studio

# Tests (API — Jest)
pnpm test                                             # all unit tests
pnpm --filter @mgmt/api test:watch                    # watch mode
pnpm --filter @mgmt/api test -- --testPathPattern=witnesses   # single file/module
pnpm --filter @mgmt/api test:e2e                      # end-to-end tests

# Tests (Web — Vitest)
pnpm --filter @mgmt/web test
```

To run within a specific app:

```bash
pnpm --filter @mgmt/web  <script>
pnpm --filter @mgmt/api  <script>
```

## apps/web — Angular Frontend

- **Angular 21**, TypeScript (strict), Tailwind CSS v4
- Standalone components — no NgModules; **do NOT set `standalone: true`** in decorators (it is the default since v20)
- Zone-based change detection with `provideClientHydration(withEventReplay())` — use `ChangeDetectionStrategy.OnPush` on **every** component
- SSR enabled: all routes prerender by default via `app.routes.server.ts` (`RenderMode.Prerender`)
- Angular Router: routes defined in `apps/web/src/app/app.routes.ts` (currently empty — routing is still being scaffolded)
- Routing segments planned: `public/` (unauthenticated), `auth/` (login/register), `private/` (guarded) — directories exist but are mostly empty shells
- Global styles in `apps/web/src/styles.css` — OKLch design tokens for light/dark, brand tokens `--mulim-azul` / `--mulim-ouro` registered in `@theme inline` as `bg-mulim-azul` / `text-mulim-ouro` Tailwind utilities
- Fonts: **Source Sans 3** (sans) + **Anonymous Pro** (mono) via Google Fonts
- Dev server on port **3000** (`ng serve`)
- Static assets served from `apps/web/public/` — referenced as absolute paths (e.g. `/logo.svg`)

### Angular Component Rules

- Use `input()` and `output()` functions — not `@Input()`/`@Output()` decorators
- Use `inject()` for DI — not constructor injection
- Put host bindings in the `host` object of `@Component`/`@Directive` — not `@HostBinding`/`@HostListener`
- Use `[class.foo]="expr"` bindings — not `[ngClass]`
- Use `[style.prop]="expr"` bindings — not `[ngStyle]`
- Use native control flow: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `NgOptimizedImage` for all static images — requires absolute `ngSrc` paths (e.g. `ngSrc="/logo.svg"`) since no loader is configured; does not work for inline base64 images nor for SVGs that embed base64 data internally (use a regular `<img src>` for those)
- Must pass all AXE checks and WCAG AA minimums (focus management, color contrast, ARIA)

### Angular Architecture

**State management** will use Angular Signals via injectable stores in `core/stores/`. The planned pattern:

```ts
@Injectable({ providedIn: 'root' })
export class FooStore {
  private _data = signal<Foo | null>(null);
  readonly data = this._data.asReadonly();
  readonly derived = computed(() => ...);
}
```

## apps/api — NestJS Backend

- **NestJS 11 + Fastify**, TypeScript (strict), Drizzle ORM, PostgreSQL
- Request flow: `Guard → Pipe → Controller → Service → Repository → Drizzle → PostgreSQL`
- All responses use envelope format: `{ data: T, meta?: { total, page, pageSize } }`
- BetterAuth handles session management; every route protected except `/health` and `/auth/*`
- Swagger UI at `http://localhost:3001/docs`

### API Common Layer (`src/common/`)

Global providers registered in `AppModule`:

| Provider | Class | Role |
|---|---|---|
| `APP_PIPE` | `ZodValidationPipe` | Validates DTOs with Zod schemas |
| `APP_FILTER` | `GlobalExceptionFilter` | Unified error responses |
| `APP_GUARD` | `AuthGuard` → `RolesGuard` | Session auth, then RBAC |
| `APP_INTERCEPTOR` | `ResponseEnvelopeInterceptor` | Wraps `{ data }` |
| `APP_INTERCEPTOR` | `AuditInterceptor` | Writes to `audit_logs` |

**Decorators:**
- `@Public()` — skips `AuthGuard` for a route
- `@Roles('advogado', 'paralegal')` — RBAC via `RolesGuard`
- `@CurrentUser()` — injects the BetterAuth session user into a parameter

### Validation Pattern (Zod + NestJS)

DTOs are created with `createZodDto()` from `src/common/pipes/create-zod-dto.ts`:

```ts
export class CreateClientDto extends createZodDto(clientSchemas.create) {}
```

All Zod schemas live in `src/schema/zod/index.ts`. Two guard wrappers enforce business rules at the schema level:

- `withWitnessGuards(schema)` — rejects any payload containing CPF, RG, CNH, or identity-doc fields (GATE-1)
- `withStrictUnknownFieldValidation(shape, schema)` — `.strict()` equivalent, rejects unknown keys

### Feature Module Pattern

Each domain under `src/modules/<feature>/` follows the same layout:

```
<feature>.module.ts       ← NestJS Module
<feature>.controller.ts   ← REST routes, Swagger decorators, DTOs
<feature>.service.ts      ← Business logic, throws NestJS exceptions
<feature>.repository.ts   ← Drizzle queries only, no business logic
<feature>.service.spec.ts ← Jest unit tests (service layer)
```

### Schema (`src/schema/`)

- `src/schema/index.ts` — Drizzle table definitions and TypeScript types (single source of truth for DB)
- `src/schema/zod/index.ts` — Zod validation schemas for all entities (create / update / filter shapes)

Domain tables: `users`, `sessions`, `accounts`, `verifications`, `clients`, `processes`, `hearings`, `witnesses`, `deadlines`, `holidays`, `emails`, `auditLogs`.

Active modules: `auth`, `clients`, `processes`, `deadlines`, `witnesses`, `hearings`, `users`, `reports`.

### Scheduled Jobs (`src/jobs/`)

- `DeadlinesJob` — calculates and updates overdue deadlines (cron)
- `HolidaySyncJob` — syncs national/state holidays from external API (cron)

Both use `@nestjs/schedule` and have corresponding `.spec.ts` files.

### API Environment Variables (`apps/api/.env`)

```env
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
PORT=3001
EMAIL_PROVIDER=smtp        # smtp | console
EMAIL_FROM=you@domain.com
SMTP_HOST=smtp.host.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@domain.com
SMTP_PASS=your_password
CORS_ALLOWED_ORIGINS=http://localhost:3000
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_BASE_PATH=/auth
DATABASE_POOL_MAX=10
```

### Critical Business Rules (API)

- **GATE-1**: CPF, RG, CNH and identity documents are **never** stored — 400 if received
- **GATE-2**: Witness hard limit — JEC (Lei 9.099) = 4 / CPC (vara comum) = 10
- **GATE-3**: `audit_logs` is **append-only** — no UPDATE or DELETE, ever
- **GATE-4**: Witness with `replaced=true` cannot receive new deadlines — 422
- **GATE-5**: `superadmin` profile cannot be deleted via API
